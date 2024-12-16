import logger from '../utils/log/logger.js';
import Queue from 'bull';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../constants/env.js';
import serviceLocator from '#locator/serviceLocator.js';
import AsyncLock from 'async-lock';
import { CLEANSING_INTERVAL, SESSION_TIMEOUT, USER_TIMEOUT } from '../constants/timeouts.js';
import { v4 as uuidv4 } from 'uuid';
import SessionManager from '#managers/sessionManager.js';
import { createResponse } from '../utils/response/createResponse.js';
import { PacketType } from '../constants/header.js';

class QueueManager {
  constructor() {
    logger.info('큐 관리자 생성');
    this.pvpMatchingQueue = new Queue('pvpMatchingQueue', {
      redis: { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD },
    });
    this.bossMatchingQueue = new Queue('bossMatchingQueue', {
      redis: { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD },
    });
    this.acceptQueue = new Queue('acceptQueue', {
      redis: { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD },
    });

    this.queueTimeout = SESSION_TIMEOUT;
    this.userTimeout = USER_TIMEOUT;
    this.cleansingInterval = CLEANSING_INTERVAL;

    this.lock = new AsyncLock();
    // this.acceptQueueLock = new AsyncLock(); // 제거 - 개별 락 대신 pendingGroups 전용 락으로 통합  // 변경 사항
    // pendingGroups 접근을 보호하기 위한 전용 락 사용
    this.pendingGroupsLock = new AsyncLock(); // 변경 사항

    this.pendingGroups = new Map();

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
      });
    });
  }

  // pendingGroups 접근을 안전하게 하기 위한 헬퍼 메서드
  async withPendingGroupsLock(fn) { // 변경 사항
    return this.pendingGroupsLock.acquire('pendingGroups', fn);
  }

  // **매칭 큐 관리**
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

        await matchingQueue.add(
          { id: user.id },
          {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 3,
            backoff: 5000,
          },
        );

        logger.info('매칭큐에 유저를 추가합니다.');

        const waitingJobs = await matchingQueue.getJobs(['waiting']);

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

  async handleBossMatching(waitingJobs, maxPlayer, matchingQueue) {
    if (waitingJobs.length >= maxPlayer) {
      const matchedJobs = waitingJobs.splice(0, maxPlayer);
      const matchedUserIds = matchedJobs.map((job) => job.data.id);

      const groupId = uuidv4();

      // pendingGroups 업데이트도 락으로 보호
      await this.withPendingGroupsLock(async () => { // 변경 사항
        this.pendingGroups.set(groupId, {
          userIds: new Set(matchedUserIds),
          acceptedIds: new Set(),
        });
      });

      await Promise.all(
        matchedJobs.map(async (job) => {
          await job.remove();
          logger.info(`매칭 큐에서 유저 ${job.data.id}를 제거했습니다.`);
        }),
      );

      return { groupId, userIds: matchedUserIds };
    }
    return null;
  }

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
        user.setMatched(false);
        return true;
      }
      logger.info('매칭큐에 유저가 존재하지 않습니다.');
      return false;
    } catch (error) {
      logger.error('매칭큐 제거 중 오류 발생:', error);
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

  // 수락 큐 제거 로직 역시 pendingGroupsLock 사용(원자적 처리를 위해)
  async removeAcceptQueueInUser(user) {
    // 여기서는 락을 걸지 않는다.
    // 만약 락이 필요한 경우는 이 함수를 호출하는 상위 로직(예: acceptUserInGroup)에서 걸어준다.
    const acceptQueueJobs = await this.acceptQueue.getJobs(['waiting']);
    const userJob = acceptQueueJobs.find((job) => job.data.id === user.id);

    if (userJob) {
      await userJob.remove();
      logger.info('AcceptQueue에서 유저를 지웠습니다.');
      user.setMatched(false);
      return true;
    }
    logger.info('AcceptQueue에 유저가 존재하지 않습니다.');
    return false;
  }

  async rejectGroup(groupId) { // 매칭 거절 시 그룹 해제 로직을 한곳에 모음  // 변경 사항
    const sessionManager = serviceLocator.get(SessionManager);
    const group = this.pendingGroups.get(groupId);
    if (!group) return;

    const failResponse = createResponse(PacketType.S_BossMatchNotification, {
      success: false,
        playerIds: [],
        partyList: [],
      });

    for (const uid of group.userIds) {
      const u = sessionManager.getUser(uid);
      if (u) {
        try {
          u.socket.write(failResponse);
        } catch(e) {
          logger.error('응답 전송 중 오류:', e);
        }
        await this.removeMatchingQueue(u, 'boss');
        await this.removeAcceptQueueInUser(u);
        u.setMatched(false);
      }
    }

    this.pendingGroups.delete(groupId);
  }

  async acceptUserInGroup(user, groupId) {
    // 이미 withPendingGroupsLock 내부에서 이 함수가 호출되고 있다고 가정
    const group = this.pendingGroups.get(groupId);
    if (!group) return false;
    group.acceptedIds.add(user.id);
    logger.info(`유저 ${user.id}가 매칭을 수락했습니다.`);

    if (group.acceptedIds.size === group.userIds.size) {
      // 모든 유저 수락 완료
      const sessionManager = serviceLocator.get(SessionManager);

      const actualMatchedPlayers = Array.from(group.userIds)
        .map((uid) => sessionManager.getUser(uid))
        .filter((u) => u !== undefined && u !== null);

      if (actualMatchedPlayers.length < group.userIds.size) {
        logger.warn('매칭된 사용자 중 일부가 유효하지 않습니다.');
        for (const p of actualMatchedPlayers) {
          // 여기서 removeAcceptQueueInUser 호출
          await this.removeAcceptQueueInUser(p);
          p.setMatched(false);
        }
        this.pendingGroups.delete(groupId);
        return false;
      }

      // 유효한 플레이어 모두 수락 처리
      for (const p of actualMatchedPlayers) {
        // 이미 withPendingGroupsLock 내이므로 문제가 없음
        await this.removeAcceptQueueInUser(p);
        p.setMatched(false);
      }

      this.pendingGroups.delete(groupId);
      return actualMatchedPlayers;
    }

    return null;
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
            if (!u) return true;
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

      await this.withPendingGroupsLock(async () => { // 변경 사항
        for (const [groupId, group] of this.pendingGroups.entries()) {
          const allUsersExist = Array.from(group.userIds).every((uid) => sessionManager.getUser(uid));
          if (!allUsersExist) {
            logger.info(`그룹 ${groupId}의 일부 유저가 존재하지 않아 그룹 제거`);
            this.pendingGroups.delete(groupId);
          }
        }
      });
    }, this.cleansingInterval);
  }
}

export default QueueManager;
