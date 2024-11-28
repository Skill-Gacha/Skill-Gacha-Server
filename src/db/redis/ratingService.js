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
  return await redisClient.zRangeWithScores(RATING_KEY, 0, topN - 1, { REV: true });
};

export const getTopRatingsWithPlayer = async (nickname, topN) => {
  try {
    // 상위 topN 데이터 가져오기 (점수 내림차순)
    const topRatings = await redisClient.zRangeWithScores(RATING_KEY, 0, topN - 1, { REV: true });

    // 각 레이팅에 랭크 정보 추가
    topRatings.forEach((entry, index) => {
      entry.rank = index + 1; // 랭크는 1부터 시작
    });

    // 타겟이 상위 리스트에 포함되어 있는지 확인
    const isNicknameInTop = topRatings.some((entry) => entry.value === nickname);

    if (!isNicknameInTop) {
      // 타겟의 정보 조회
      const [playerRank, playerScore] = await Promise.all([
        redisClient.zRevRank(RATING_KEY, nickname),
        redisClient.zScore(RATING_KEY, nickname),
      ]);

      if (playerRank !== null && playerScore !== null) {
        // 타겟의 레이팅 정보를 리스트에 추가
        topRatings.push({
          value: nickname,
          score: playerScore,
          rank: playerRank + 1, // Redis의 ZRevRank는 0부터 시작하므로 1을 더함
        });

        // 추가되면 topN+1개
        return topRatings.slice(0, topN + 1);
      }
    }

    return topRatings;
  } catch (error) {
    console.error('ratingService: getTopRatingsWithPlayer: 레이팅 정보를 가져오는 중 오류 발생', error);
    throw error;
  }
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
