// src/db/redis/skillService.js

import redisClient from '../../init/redis.js';

const SKILL_KEY = 'skills';

export const saveSkillsToRedis = async (nickname, skills) => {
  const key = `${SKILL_KEY}:${nickname}`;
  await redisClient.hSet(key, skills); // Store skill IDs as strings
};

// Save skills to Redis
export const saveRewardSkillsToRedis = async (nickname, rewardSkillId, replaceSkillIdx) => {
  const currentSkillSet = await getSkillsFromRedis(nickname);

  if (!currentSkillSet) {
    throw new Error('닉네임에 해당하는 스킬셋을 찾을 수 없습니다.');
  }

  let targetIdx = null;

  if (replaceSkillIdx == null) {
    // 처음으로 등장하는 0 찾기
    for (let i = 1; i <= 4; i++) {
      if (currentSkillSet[`skill${i}`] === 0) {
        targetIdx = i;
        break;
      }
    }
  } else {
    // Use the provided index (replaceSkillIdx) if it is valid
    if (replaceSkillIdx >= 1 && replaceSkillIdx <= 4) {
      targetIdx = replaceSkillIdx;
    } else {
      throw new Error('replaceSkillIdx의 범위는 1이상 4이하여야 합니다.');
    }
  }

  if (targetIdx == null) {
    throw new Error('스킬 교체 타겟 인덱스를 찾지 못했습니다.');
  }

  // 스킬 교체 또는 추가
  currentSkillSet[`skill${targetIdx}`] = rewardSkillId;
  console.log(currentSkillSet);

  // 레디스에 저장할 데이터 준비
  const updatedSkills = Object.entries(currentSkillSet).reduce((acc, [key, value]) => {
    // Ensure that the value is a valid number
    if (typeof value !== 'number' || isNaN(value)) {
      acc[key] = '0'; // Default to "0" if invalid
    } else {
      acc[key] = value.toString(); // Convert number to string
    }
    return acc;
  }, {});

  // Save updated skills back to Redis
  const key = `${SKILL_KEY}:${nickname}`;
  await redisClient.hSet(key, updatedSkills);

  console.log(`${nickname}의 스킬 업데이트 완료:`, updatedSkills);
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
