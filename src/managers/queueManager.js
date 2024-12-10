// src/managers/sessionManager.js

import logger from '../utils/log/logger.js';
import Queue from 'bull';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../constants/env.js';
import SessionManager from './sessionManager.js';
import serviceLocator from '#locator/serviceLocator.js';

// 싱글톤 클래스
class QueueManager {
  constructor() {
    logger.info(`큐 관리자 생성`);
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

    this.queueTimeout = 1800000; // 30분
    this.userTimeout = 1800000; // 30분
    this.cleansingInterval = 180000; // 3분
    this.startCleansingInterval();
  }

  // **매칭 큐 관리 (유저 ID만 저장)**
  async addMatchingQueue(user, maxPlayer, queueType) {
    const matchingQueue = this.getMatchingQueue(queueType);
    const existingUser = await this.isUserAlreadyInQueue(matchingQueue, user.id);

    if (existingUser) {
      logger.info('이미 매칭중인 유저입니다.');
      return null;
    }

    user.matchingAddedAt = Date.now();

    // 유저 ID만 큐에 추가
    await matchingQueue.add({ id: user.id });
    logger.info('매칭큐에 유저를 추가합니다.');
    const updateWaitingJobs = await matchingQueue.getJobs('waiting');

    // 매칭 조건 충족 시 유저 ID 목록 반환
    if (queueType === 'boss') {
      return this.handleBossMatching(updateWaitingJobs, maxPlayer);
    } else if (queueType === 'pvp') {
      return this.handlePvpMatching(updateWaitingJobs, maxPlayer);
    }
  }

  // BOSS 매칭
  async handleBossMatching(waitingJobs, maxPlayer) {
    if (waitingJobs.length >= maxPlayer) {
      const matchedJobs = waitingJobs.splice(0, maxPlayer);
      const matchedUserIds = matchedJobs.map((job) => job.data.id);

      await Promise.all(
        matchedJobs.map(async (job) => {
          const acceptQueue = this.acceptQueue;
          const acceptQueueJobs = await acceptQueue.getJobs('waiting');
          const existingJob = acceptQueueJobs.find((queueJob) => queueJob.data.id === job.data.id);
          if (!existingJob) {
            await acceptQueue.add({ id: job.data.id });
            logger.info('acceptQueue에 유저를 추가합니다.');
          } else {
            logger.info('유저가 이미 acceptQueue에 존재합니다.');
          }
          await job.remove();
        }),
      );

      return matchedUserIds.map((userId) => ({ id: userId }));
    }
    return null;
  }

  // PVP 매칭
  async handlePvpMatching(waitingJobs, maxPlayer) {
    if (waitingJobs.length >= maxPlayer) {
      const matchedJobs = waitingJobs.splice(0, maxPlayer);
      const matchedUserIds = matchedJobs.map((job) => job.data.id);

      await Promise.all(
        matchedJobs.map(async (job) => {
          await job.remove();
        }),
      );

      return matchedUserIds.map((userId) => ({ id: userId }));
    }
    return null;
  }

  async isUserAlreadyInQueue(queue, userId) {
    const matchingQueueJobs = await queue.getJobs('waiting');
    return matchingQueueJobs.find((job) => job.data.id === userId);
  }

  async removeMatchingQueue(user, queueType) {
    const matchingQueue = this.getMatchingQueue(queueType);
    const existingUser = await this.isUserAlreadyInQueue(matchingQueue, user.id);

    if (existingUser) {
      await existingUser.remove();
      logger.info('매칭큐에서 유저를 지웠습니다.');
      return true;
    }
    logger.info('매칭큐에 유저가 존재하지 않습니다.');
    return false;
  }

  getAcceptQueue() {
    return this.acceptQueue;
  }

  async removeAcceptQueueInUser(user) {
    const acceptQueueJobs = await this.acceptQueue.getJobs('waiting');
    const userJob = acceptQueueJobs.find((job) => job.data.id === user.id);

    if (userJob) {
      await userJob.remove();
      logger.info('AcceptQueue에서 유저를 지웠습니다.');
      return true;
    }
    logger.info('AcceptQueue에 유저가 존재하지 않습니다.');
    return false;
  }

  getMatchingQueue(queueType) {
    if (queueType === 'boss') {
      return this.bossMatchingQueue;
    } else if (queueType === 'pvp') {
      return this.pvpMatchingQueue;
    } else {
      logger.error(`유효하지 않은 큐 타입: ${queueType}`);
      return [];
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
        const waitingJobs = await matchingQueue.getJobs('waiting');

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
          logger.info(`${queueType.toUpperCase()} 매칭 큐 클렌징 `);
        }
        else {
          logger.info(`${queueType.toUpperCase()}큐가 비어있거나 타임아웃인 유저가 존재하지 않아 클렌징이 수행되지 않았습니다.`)
        }
      }
    }, this.cleansingInterval);
  }
}

export default QueueManager;
