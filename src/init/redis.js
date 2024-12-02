// src/init/redis.js

import { createClient } from 'redis';
import dotenv from 'dotenv';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../constants/env.js';
import logger from '../utils/log/logger.js';
import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';

dotenv.config();

/**
 * 레디스 클라이언트 설정
 */
const redisClient = createClient({
  //   url: `redis://${REDIS_USERNAME}:${REDIS_USERPASS}@${REDIS_HOST}:${REDIS_PORT}/0`,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
  password: REDIS_PASSWORD,
});

/**
 * 레디스 클라이언트 초기화
 */
export const initRedisClient = async () => {
  try {
    redisClient.on('error', (err) => {
    });

    await redisClient.connect();

    logger.info('Redis 초기화 완료');
  } catch (error) {
    throw new CustomError(ErrorCodes.REDIS_INIT_FAILED, 'Redis 초기화 실패');
  }
};

export default redisClient;