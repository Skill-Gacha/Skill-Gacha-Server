// src/init/redis.js

import { createClient } from 'redis';
import dotenv from 'dotenv';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../constants/env.js';
import logger from '../utils/log/logger.js';
import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';

dotenv.config();

const MAX_RETRIES = 12;
const RETRY_DELAY = 5000;

const redisClient = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
  password: REDIS_PASSWORD,
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const initRedisClient = async () => {
  let attempt = 0;

  redisClient.on('error', (err) => {
    logger.error(`Redis 클라이언트 에러: ${err.message}`);
  });

  while (attempt < MAX_RETRIES) {
    try {
      await redisClient.connect();
      logger.info('Redis 초기화 완료');
      return;
    } catch (error) {
      attempt += 1;
      logger.error(
        `Redis 초기화 실패 (${attempt} / ${MAX_RETRIES}): ${error.message}`
      );

      if (attempt >= MAX_RETRIES) {
        logger.error('최대 재시도 회수에 도달했습니다. Redis 초기화에 실패했습니다.');
        throw new CustomError(
          ErrorCodes.REDIS_INIT_FAILED,
          'Redis 초기화 실패'
        );
      }

      logger.info(`${RETRY_DELAY / 1000} 초 안에 Redis 연결을 재시도 합니다.`);
      await wait(RETRY_DELAY);
    }
  }
};

export default redisClient;
