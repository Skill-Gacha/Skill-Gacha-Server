// src/managers/queueManager.js

import logger from '../utils/log/logger.js';
import Queue from 'bull';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../constants/env.js';
import serviceLocator from '#locator/serviceLocator.js';
import AsyncLock from 'async-lock';
import { CLEANSING_INTERVAL, SESSION_TIMEOUT, USER_TIMEOUT } from '../constants/timeouts.js';
import { v4 as uuidv4 } from 'uuid';
import SessionManager from '#managers/sessionManager.js';

class QueueManager {
  constructor() {
    logger.info('큐 관리자 생성');
    // Bull 큐 초기화 (유저 ID만 저장)
    this.pvpMatchingQueue = new Queue('pvpMatchingQueue', {
      redis: { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD },
    });
    this.bossMatchingQueue = new Queue('bossMatchingQueue', {
      redis: { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD },
    });
    this.acceptQueue = new Queue('acceptQueue', {
      redis: { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD },
    });

    this.queueTimeout = SESSION_TIMEOUT; // 30분
    this.userTimeout = USER_TIMEOUT; // 30분
    this.cleansingInterval = CLEANSING_INTERVAL; // 1분

    this.lock = new AsyncLock();
    this.acceptQueueLock = new AsyncLock(); // acceptQueue를 위한 별도의 락 추가

    this.pendingGroups = new Map(); // groupId -> { userIds: Set, acceptedIds: Set }

    // Job 이벤트 리스닝
    this.setupJobListeners();

    this.startCleansingInterval();
  }

  setupJobListeners() {
    const queues = [this.pvpMatchingQueue, this.bossMatchingQueue, this.acceptQueue];
    queues.forEach((queue) => {
      queue.on('completed', (job, result) => {
        logger.info(`${queue.name} Job 완료: ${job.id}`);
      });

      queue.on('failed', (job, err) => {
        logger.error(`${queue.name} Job 실패: ${job.id}`, err);
        // 필요 시 재시도 로직 또는 알림 추가
      });
    });
  }

  // **매칭 큐 관리 (유저 ID만 저장)**
  async addMatchingQueue(user, maxPlayer, queueType) {
    return this.lock.acquire(`matchingQueue_${queueType}`, async () => {
      try {
        if (user.isMatched) {
          logger.info('이미 매칭된 유저입니다.');
          return null;
        }

        const matchingQueue = this.getMatchingQueue(queueType);
        if (!matchingQueue) {
          logger.error(`유효하지 않은 큐 타입: ${queueType}`);
          return null;
        }

        const existingUser = await this.isUserAlreadyInQueue(matchingQueue, user.id);

        if (existingUser) {
          logger.info('이미 매칭중인 유저입니다.');
          return null;
        }

        user.matchingAddedAt = Date.now();

        // 유저 ID만 큐에 원자적으로 추가
        await matchingQueue.add(
          { id: user.id },
          {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 3, // 최대 3회 재시도
            backoff: 5000, // 5초 간격으로 재시도
          },
        );

        logger.info('매칭큐에 유저를 추가합니다.');

        const waitingJobs = await matchingQueue.getJobs(['waiting']);

        // 매칭 조건 충족 시 매칭 그룹 생성
        if (queueType === 'boss') {
          return this.handleBossMatching(waitingJobs, maxPlayer, matchingQueue);
        } else if (queueType === 'pvp') {
          return this.handlePvpMatching(waitingJobs, maxPlayer, matchingQueue);
        }
      } catch (error) {
        logger.error('매칭큐 추가 중 오류 발생:', error);
        return null;
      }
    });
  }

  // BOSS 매칭
  async handleBossMatching(waitingJobs, maxPlayer, matchingQueue) {
    if (waitingJobs.length >= maxPlayer) {
      const matchedJobs = waitingJobs.splice(0, maxPlayer);
      const matchedUserIds = matchedJobs.map((job) => job.data.id);

      // 새로운 그룹 ID 생성
      const groupId = uuidv4();
      this.pendingGroups.set(groupId, {
        userIds: new Set(matchedUserIds),
        acceptedIds: new Set(),
      });

      // 매칭된 유저들을 매칭 큐에서 제거
      await Promise.all(
        matchedJobs.map(async (job) => {
          await job.remove();
          logger.info(`매칭 큐에서 유저 ${job.data.id}를 제거했습니다.`);
        }),
      );

      // 그룹 ID와 유저 ID 반환
      return { groupId, userIds: matchedUserIds };
    }
    return null;
  }

  // PVP 매칭
  async handlePvpMatching(waitingJobs, maxPlayer, matchingQueue) {
    if (waitingJobs.length >= maxPlayer) {
      const matchedJobs = waitingJobs.splice(0, maxPlayer);
      const matchedUserIds = matchedJobs.map((job) => job.data.id);

      await Promise.all(
        matchedJobs.map(async (job) => {
          await job.remove();
          logger.info(`매칭 큐에서 유저 ${job.data.id}를 제거했습니다.`);
        }),
      );

      return matchedUserIds.map((userId) => ({ id: userId }));
    }
    return null;
  }

  async isUserAlreadyInQueue(queue, userId) {
    const matchingQueueJobs = await queue.getJobs(['waiting']);
    return matchingQueueJobs.find((job) => job.data.id === userId);
  }

  async removeMatchingQueue(user, queueType) {
    try {
      const matchingQueue = this.getMatchingQueue(queueType);
      if (!matchingQueue) {
        logger.error(`유효하지 않은 큐 타입: ${queueType}`);
        return false;
      }

      const existingUser = await this.isUserAlreadyInQueue(matchingQueue, user.id);

      if (existingUser) {
        await existingUser.remove();
        logger.info('매칭큐에서 유저를 지웠습니다.');
        user.setMatched(false); // 매칭 상태 해제
        return true;
      }
      logger.info('매칭큐에 유저가 존재하지 않습니다.');
      return false;
    } catch (error) {
      logger.error('매칭큐 제거 중 오류 발생:', error);
      return false;
    }
  }

  getAcceptQueue() {
    return this.acceptQueue;
  }

  async removeAcceptQueueInUser(user) {
    try {
      return await this.acceptQueueLock.acquire('acceptQueue', async () => {
        const acceptQueueJobs = await this.acceptQueue.getJobs(['waiting']);
        const userJob = acceptQueueJobs.find((job) => job.data.id === user.id);

        if (userJob) {
          await userJob.remove();
          logger.info('AcceptQueue에서 유저를 지웠습니다.');
          user.setMatched(false); // 매칭 상태 해제
          return true;
        }
        logger.info('AcceptQueue에 유저가 존재하지 않습니다.');
        return false;
      });
    } catch (error) {
      logger.error('AcceptQueue에서 유저 제거 중 오류 발생:', error);
      return false;
    }
  }

  getMatchingQueue(queueType) {
    if (queueType === 'boss') {
      return this.bossMatchingQueue;
    } else if (queueType === 'pvp') {
      return this.pvpMatchingQueue;
    } else {
      logger.error(`유효하지 않은 큐 타입: ${queueType}`);
      return null;
    }
  }

  // **큐 클렌징 로직**
  async startCleansingInterval() {
    setInterval(async () => {
      logger.info('큐 클렌징 동작 시작');
      const now = Date.now();
      const sessionManager = serviceLocator.get(SessionManager);

      for (const queueType of ['pvp', 'boss']) {
        const matchingQueue = this.getMatchingQueue(queueType);
        if (!matchingQueue) continue;

        try {
          const waitingJobs = await matchingQueue.getJobs(['waiting']);

          const jobsToRemove = waitingJobs.filter((job) => {
            const { id: uid } = job.data;
            const u = sessionManager.getUser(uid);
            if (!u) return true; // 유저가 없으면 제거
            if (now - u.matchingAddedAt > this.userTimeout) {
              logger.info(`매칭 큐에서 사용자 ${uid} 제거`);
              return true;
            }
            return false;
          });

          await Promise.all(jobsToRemove.map((job) => job.remove()));

          if (jobsToRemove.length > 0) {
            logger.info(`${queueType.toUpperCase()} 매칭 큐 클렌징 완료`);
          } else {
            logger.info(
              `${queueType.toUpperCase()} 큐가 비어있거나 타임아웃인 유저가 존재하지 않아 클렌징이 수행되지 않았습니다.`,
            );
          }
        } catch (error) {
          logger.error(`${queueType.toUpperCase()} 매칭 큐 클렌징 중 오류 발생:`, error);
        }
      }

      // Pending Groups 클렌징
      for (const [groupId, group] of this.pendingGroups.entries()) {
        const allUsersExist = Array.from(group.userIds).every((uid) => sessionManager.getUser(uid));
        if (!allUsersExist) {
          logger.info(`그룹 ${groupId}의 일부 유저가 존재하지 않아 그룹 제거`);
          this.pendingGroups.delete(groupId);
        }
      }
    }, this.cleansingInterval);
  }
}

export default QueueManager;
