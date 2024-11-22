// src/db/rating/ratingService.js

import redisClient from '../../init/redis.js';

const RATING_KEY = 'pvp_rating';

// Redis에 플레이어 레이팅 업데이트
export const updatePlayerRating = async (nickname, rating) => {
  await redisClient.zAdd(RATING_KEY, {
    score: rating,
    value: nickname,
  });
};

// Redis에서 플레이어 레이팅 조회
export const getPlayerRatingFromRedis = async (nickname) => {
  const rating = await redisClient.zScore(RATING_KEY, nickname);
  return rating !== null ? parseInt(rating, 10) : null;
};

// Redis에서 상위 N명의 플레이어 레이팅 조회
export const getTopRatings = async (topN) => {
  return await redisClient.zRangeWithScores(RATING_KEY, -topN, -1, { REV: true });
};

// Redis에서 특정 플레이어의 랭크 조회
export const getPlayerRank = async (nickname) => {
  const rank = await redisClient.zRevRank(RATING_KEY, nickname);
  return rank !== null ? rank + 1 : null;
};


// Redis에서 모든 레이팅 가져오기
export const getAllRatingsFromRedis = async () => {
  try {
    const ratings = await redisClient.zRangeWithScores(RATING_KEY, 0, -1);
    return ratings;
  } catch (error) {
    console.error('Redis로부터 레이팅 정보 가져오기 실패:', error);
    throw error;
  }
};
