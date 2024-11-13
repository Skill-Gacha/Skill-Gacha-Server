// src/init/redis.js

import { createClient } from 'redis';
import dotenv from 'dotenv';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../constants/env.js';

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
  redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
  });

  await redisClient.connect();

  console.log(' =init_RedisClient= ');
};

export default redisClient;