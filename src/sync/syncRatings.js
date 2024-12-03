// src/sync/syncRatings.js

import { saveRatingToDB } from '../db/rating/ratingDb.js';
import { getAllRatingsFromRedis } from '../db/redis/ratingService.js';
import logger from '../utils/log/logger.js';
import pLimit from 'p-limit';

export const syncRatingsToDB = async () => {
  try {
    logger.info('레이팅 동기화 작업 시작...');

    const allRatings = await getAllRatingsFromRedis();

    if (allRatings.length === 0) {
      logger.info('동기화할 레이팅 정보가 없습니다.');
      return;
    }

    // 동시 실행 개수 제한 설정
    const limit = pLimit(100);

    const savePromises = allRatings.map(({ value: nickname, score: rating }) =>
      limit(async () => {
        await saveRatingToDB(nickname, rating);
      })
    );

    // 모든 제한된 비동기 작업 완료 대기
    await Promise.all(savePromises);

    logger.info('레이팅 동기화 작업 완료.');
  } catch (error) {
    logger.error('syncRatings: 레이팅 동기화 중 오류 발생:', error);
    throw error;
  }
};
