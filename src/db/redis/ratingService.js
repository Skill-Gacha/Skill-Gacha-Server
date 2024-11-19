// src/db/redis/ratingService.js

import redisClient from '../../init/redis.js';

const RATING_KEY = 'pvp_rating';

// Update player rating in Redis
export const updatePlayerRating = async (nickname, rating) => {
  await redisClient.zAdd(`${RATING_KEY}`, {
    score: rating,
    value: nickname,
  });
};

// Get player rating from Redis
export const getPlayerRatingFromRedis = async (nickname) => {
  const rating = await redisClient.zScore(`${RATING_KEY}`, nickname);
  return rating !== null ? parseInt(rating, 10) : null;
};

// Get top N ratings
export const getTopRatings = async (topN) => {
  return await redisClient.zRangeWithScores(`${RATING_KEY}`, -topN, -1, { REV: true });
};

// Get player's rank
export const getPlayerRank = async (nickname) => {
  const rank = await redisClient.zRevRank(`${RATING_KEY}`, nickname);
  return rank !== null ? rank + 1 : null;
};

