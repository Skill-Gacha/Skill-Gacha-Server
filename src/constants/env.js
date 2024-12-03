// src/constants/env.js

import dotenv from 'dotenv';
import { z } from 'zod';
import logger from '../utils/log/logger.js';

// 환경변수 로드
dotenv.config();

// 환경변수 스키마 정의
// nonempty <- Deprecated
const envSchema = z.object({
  // SERVER
  HOST: z.string().min(1, 'HOST는 필수 값입니다.'),
  PORT: z
    .string()
    .min(1, 'PORT는 필수 값입니다.')
    .refine((val) => !isNaN(Number(val)), 'PORT는 숫자여야 합니다.'),

  // SQL_DB
  DB_NAME: z.string().min(1, 'DB_NAME은 필수 값입니다.'),
  DB_USER: z.string().min(1, 'DB_USER는 필수 값입니다.'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD는 필수 값입니다.'),
  DB_HOST: z.string().min(1, 'DB_HOST는 필수 값입니다.'),
  DB_PORT: z
    .string()
    .min(1, 'DB_PORT는 필수 값입니다.')
    .refine((val) => !isNaN(Number(val)), 'DB_PORT는 숫자여야 합니다.'),

  // REDIS
  REDIS_PASSWORD: z.string().min(1, 'REDIS_PASSWORD는 필수 값입니다.'),
  REDIS_HOST: z.string().min(1, 'REDIS_HOST는 필수 값입니다.'),
  REDIS_PORT: z
    .string()
    .min(1, 'REDIS_PORT는 필수 값입니다.')
    .refine((val) => !isNaN(Number(val)), 'REDIS_PORT는 숫자여야 합니다.'),
});

// 유효성 검사
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  logger.error('환경변수 검증에 실패했습니다. 아래 내용을 확인하세요:');
  logger.error(JSON.stringify(parsedEnv.error.errors, null, 2));
  process.exit(1);
}

// 검증된 데이터 추출
export const {
  HOST,
  PORT,
  CLIENT_VERSION,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  REDIS_PASSWORD,
  REDIS_HOST,
  REDIS_PORT,
} = parsedEnv.data;
