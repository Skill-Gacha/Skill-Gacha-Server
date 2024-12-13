// src/managers/queueManager.js

import Queue from 'bull';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../constants/env.js';
import logger from '../utils/log/logger.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';

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
    try {
      const matchingQueue = this.getMatchingQueue(queueType);
      if (!matchingQueue) {
        throw new Error(`Invalid queue type: ${queueType}`);
      }

      const isAlreadyInQueue = await this.isUserAlreadyInQueue(matchingQueue, user.id);
      if (isAlreadyInQueue) {
        logger.info('이미 매칭중인 유저입니다.');
        return null;
      }

      user.matchingAddedAt = Date.now();

      // Bull의 unique job feature를 사용하여 중복 추가 방지
      await matchingQueue.add(
        { id: user.id },
        { jobId: user.id, removeOnComplete: true, removeOnFail: true }
      );
      logger.info(`매칭큐에 유저(${user.id})를 추가합니다.`);

      const matchedPlayers = await this.attemptMatch(matchingQueue, maxPlayer, queueType);
      return matchedPlayers;
    } catch (error) {
      logger.error('매칭큐 추가 중 오류 발생:', error);
      throw error; // 에러를 상위로 전달하여 핸들러에서 처리하도록 함
    }
  }

  // 매칭 시도 함수
  async attemptMatch(matchingQueue, maxPlayer, queueType) {
    const waitingJobs = await matchingQueue.getWaiting(0, maxPlayer - 1);
    if (waitingJobs.length >= maxPlayer) {
      const matchedJobs = waitingJobs.slice(0, maxPlayer);
      const matchedUserIds = matchedJobs.map((job) => job.data.id);

      // acceptQueue에 유저 추가 (Atomic Operation)
      const pipeline = this.acceptQueue.client.multi();
      matchedJobs.forEach((job) => {
        pipeline.lrem(this.acceptQueue.name, 0, JSON.stringify({ id: job.data.id }));
        pipeline.lpush(this.acceptQueue.name, JSON.stringify({ id: job.data.id }));
      });
      await pipeline.exec();

      // 매칭 큐에서 유저 제거
      await Promise.all(matchedJobs.map((job) => job.remove()));

      logger.info(`매칭 성공: ${matchedUserIds.join(', ')}`);

      return matchedUserIds.map((userId) => ({ id: userId }));
    }
    return null;
  }

  // PVP 매칭 로직 (유사하게 수정 가능)
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
    const existingJob = await queue.getJob(userId);
    return existingJob !== null;
  }

  async removeMatchingQueue(user, queueType) {
    try {
      const matchingQueue = this.getMatchingQueue(queueType);
      if (!matchingQueue) {
        throw new Error(`Invalid queue type: ${queueType}`);
      }

      const existingJob = await matchingQueue.getJob(user.id);
      if (existingJob) {
        await existingJob.remove();
        logger.info(`매칭큐에서 유저(${user.id})를 지웠습니다.`);
        return true;
      }
      logger.info(`매칭큐에 유저(${user.id})가 존재하지 않습니다.`);
      return false;
    } catch (error) {
      logger.error('매칭큐 제거 중 오류 발생:', error);
      throw error;
    }
  }

  getAcceptQueue() {
    return this.acceptQueue;
  }

  async removeAcceptQueueInUser(user) {
    try {
      const job = await this.acceptQueue.getJob(user.id);
      if (job) {
        await job.remove();
        logger.info(`AcceptQueue에서 유저(${user.id})를 지웠습니다.`);
        return true;
      }
      logger.info(`AcceptQueue에 유저(${user.id})가 존재하지 않습니다.`);
      return false;
    } catch (error) {
      logger.error('AcceptQueue에서 유저 제거 중 오류 발생:', error);
      throw error;
    }
  }

  getMatchingQueue(queueType) {
    switch (queueType) {
      case 'boss':
        return this.bossMatchingQueue;
      case 'pvp':
        return this.pvpMatchingQueue;
      default:
        logger.error(`유효하지 않은 큐 타입: ${queueType}`);
        return null;
    }
  }

  // **큐 클렌징 로직 최적화**
  async startCleansingInterval() {
    setInterval(async () => {
      logger.info('큐 클렌징 동작 시작');
      const now = Date.now();
      const sessionManager = serviceLocator.get(SessionManager);

      for (const queueType of ['pvp', 'boss']) {
        const matchingQueue = this.getMatchingQueue(queueType);
        if (!matchingQueue) continue;

        try {
          const waitingJobs = await matchingQueue.getWaiting();
          const jobsToRemove = [];

          for (const job of waitingJobs) {
            const { id: uid } = job.data;
            const user = sessionManager.getUser(uid);
            if (!user || now - user.matchingAddedAt > this.userTimeout) {
              jobsToRemove.push(job);
            }
          }

          await Promise.all(jobsToRemove.map((job) => job.remove()));

          if (jobsToRemove.length > 0) {
            logger.info(`${queueType.toUpperCase()} 매칭 큐 클렌징: ${jobsToRemove.length}명 제거`);
          } else {
            logger.info(
              `${queueType.toUpperCase()} 큐가 비어있거나 타임아웃인 유저가 존재하지 않아 클렌징이 수행되지 않았습니다.`,
            );
          }
        } catch (error) {
          logger.error(`${queueType.toUpperCase()} 큐 클렌징 중 오류 발생:`, error);
        }
      }
    }, this.cleansingInterval);
  }
}

export default QueueManager;
