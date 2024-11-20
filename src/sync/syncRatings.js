// src/sync/syncRatings.js

// 모든 플레이어의 레이팅 정보를 MySQL에 동기화
import { saveRatingToDB } from '../db/rating/ratingDb.js';
import { getAllRatingsFromRedis } from '../db/redis/ratingService.js';

export const syncRatingsToDB = async () => {
  try {
    console.log('레이팅 동기화 작업 시작...');

    // Redis에서 모든 레이팅 정보 가져오기
    const allRatings = await getAllRatingsFromRedis();

    if (allRatings.length === 0) {
      console.log('동기화할 레이팅 정보가 없습니다.');
      return;
    }

    // MySQL에 레이팅 정보 저장
    const savePromises = allRatings.map(({ value: nickname, score: rating }) => saveRatingToDB(nickname, rating));
    await Promise.all(savePromises);

    console.log('레이팅 동기화 작업 완료.');
  } catch (error) {
    console.error('레이팅 동기화 중 오류 발생:', error);
    throw error; // 필요 시 외부로 에러를 던짐
  }
};
