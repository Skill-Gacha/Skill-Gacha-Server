// src/sync/syncRatings.js

import { saveRatingToDB } from '../db/rating/ratingDb.js';
import { getAllRatingsFromRedis } from '../db/redis/ratingService.js';

export const syncRatingsToDB = async () => {
  try {
    console.log('레이팅 동기화 작업 시작...');

    const allRatings = await getAllRatingsFromRedis();

    if (allRatings.length === 0) {
      console.log('동기화할 레이팅 정보가 없습니다.');
      return;
    }

    const savePromises = allRatings.map(({ value: nickname, score: rating }) =>
      saveRatingToDB(nickname, rating)
    );
    await Promise.all(savePromises);

    console.log('레이팅 동기화 작업 완료.');
  } catch (error) {
    console.error('syncRatings: 레이팅 동기화 중 오류 발생:', error);
    throw error;
  }
};
