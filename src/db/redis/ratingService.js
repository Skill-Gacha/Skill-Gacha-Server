// src/db/redis/ratingService.js

import redisClient from '../../init/redis.js';

const RATING_KEY = 'pvp_rating';

export const updatePlayerRating = async (nickname, rating) => {
  await redisClient.zAdd(RATING_KEY, {
    score: rating,
    value: nickname,
  });
};

export const saveRatingToRedis = async (nickname, rating) => {
  await redisClient.zAdd(RATING_KEY, {
    score: rating,
    value: nickname,
  });
};

export const getPlayerRatingFromRedis = async (nickname) => {
  const rating = await redisClient.zScore(RATING_KEY, nickname);
  return rating !== null ? parseInt(rating, 10) : null;
};

export const getTopRatings = async (topN) => {
  return await redisClient.zRangeWithScores(RATING_KEY, -topN, -1, { REV: true });
};

export const getPlayerRank = async (nickname) => {
  const rank = await redisClient.zRevRank(RATING_KEY, nickname);
  return rank !== null ? rank + 1 : null;
};

export const getAllRatingsFromRedis = async () => {
  try {
    return await redisClient.zRangeWithScores(RATING_KEY, 0, -1);
  } catch (error) {
    console.error('ratingService: Redis로부터 레이팅 정보 가져오기 실패:', error);
    throw error;
  }
};
