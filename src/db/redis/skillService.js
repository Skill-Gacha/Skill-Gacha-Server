// src/db/redis/skillService.js

import redisClient from '../../init/redis.js';

const SKILL_KEY = 'skills';

// Save skills to Redis
export const saveSkillsToRedis = async (nickname, skills) => {
  const key = `${SKILL_KEY}:${nickname}`;
  await redisClient.hSet(key, skills); // Store skill IDs as strings
};

// Get skills from Redis
export const getSkillsFromRedis = async (nickname) => {
  const key = `${SKILL_KEY}:${nickname}`;
  const skills = await redisClient.hGetAll(key);
  if (Object.keys(skills).length === 0) return null;
  return {
    skill1: skills.skill1 ? parseInt(skills.skill1, 10) : null,
    skill2: skills.skill2 ? parseInt(skills.skill2, 10) : null,
    skill3: skills.skill3 ? parseInt(skills.skill3, 10) : null,
    skill4: skills.skill4 ? parseInt(skills.skill4, 10) : null,
  };
};

// Delete skills from Redis
export const deleteSkillsFromRedis = async (nickname) => {
  const key = `${SKILL_KEY}:${nickname}`;
  await redisClient.del(key);
};

// Fetch rating from Redis
export const getPlayerRatingFromRedis = async (nickname) => {
  const rating = await redisClient.zScore('pvp_rating', nickname);
  return rating !== null ? parseInt(rating, 10) : null;
};

// Save rating to Redis
export const saveRatingToRedis = async (nickname, rating) => {
  await redisClient.zAdd('pvp_rating', {
    score: rating,
    value: nickname,
  });
};
