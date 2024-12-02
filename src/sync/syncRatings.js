// src/sync/syncRatings.js

import { saveRatingToDB } from '../db/rating/ratingDb.js';
import { getAllRatingsFromRedis } from '../db/redis/ratingService.js';
import logger from '../utils/log/logger.js';

export const syncRatingsToDB = async () => {
  try {
    logger.info('레이팅 동기화 작업 시작...');

    const allRatings = await getAllRatingsFromRedis();

    if (allRatings.length === 0) {
      logger.info('동기화할 레이팅 정보가 없습니다.');
      return;
    }

    const savePromises = allRatings.map(({ value: nickname, score: rating }) =>
      saveRatingToDB(nickname, rating),
    );
    await Promise.all(savePromises);

    logger.info('레이팅 동기화 작업 완료.');
  } catch (error) {
    logger.error('syncRatings: 레이팅 동기화 중 오류 발생:', error);
    throw error;
  }
};
