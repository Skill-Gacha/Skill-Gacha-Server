// src/db/redis/skillService.js

import redisClient from '../../init/redis.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import CustomError from '../../utils/error/customError.js';
import logger from '../../utils/log/logger.js';

const SKILL_KEY = 'skills';

export const saveSkillsToRedis = async (nickname, skills) => {
  const key = `${SKILL_KEY}:${nickname}`;
  await redisClient.hSet(key, skills);
};

export const saveRewardSkillsToRedis = async (nickname, rewardSkillId, replaceSkillIdx) => {
  const currentSkillSet = await getSkillsFromRedis(nickname);

  if (!currentSkillSet) {
    logger.error('skillService: 닉네임에 해당하는 스킬셋을 찾을 수 없습니다.');
    throw new CustomError(ErrorCodes.NO_VALID_SKILLSET_FOR_USER, '닉네임에 해당하는 스킬셋을 찾을 수 없습니다.');
  }

  let targetIdx = null;

  if (replaceSkillIdx == null) {
    for (let i = 1; i <= 4; i++) {
      if (currentSkillSet[`skill${i}`] === 0) {
        targetIdx = i;
        break;
      }
    }
  } else {
    if (replaceSkillIdx >= 1 && replaceSkillIdx <= 4) {
      targetIdx = replaceSkillIdx;
    } else {
      throw new CustomError(ErrorCodes.OUT_OF_RANGE, 'skillService: replaceSkillIdx의 범위는 1이상 4이하여야 합니다.');
    }
  }

  if (targetIdx == null) {
    throw new CustomError(ErrorCodes.NO_VALID_REPLACE_TARGET_INDEX, '스킬 교체 타겟 인덱스를 찾지 못했습니다.');
  }

  currentSkillSet[`skill${targetIdx}`] = rewardSkillId;

  const updatedSkills = Object.entries(currentSkillSet).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'number' && !isNaN(value) ? value.toString() : '0';
    return acc;
  }, {});

  const key = `${SKILL_KEY}:${nickname}`;
  await redisClient.hSet(key, updatedSkills);

  logger.info(`${nickname}의 스킬 업데이트 완료:`, updatedSkills);
};

export const getSkillsFromRedis = async (nickname) => {
  const key = `${SKILL_KEY}:${nickname}`;
  const skills = await redisClient.hGetAll(key);
  if (Object.keys(skills).length === 0) return null;
  return {
    skill1: skills.skill1 ? parseInt(skills.skill1, 10) : 0,
    skill2: skills.skill2 ? parseInt(skills.skill2, 10) : 0,
    skill3: skills.skill3 ? parseInt(skills.skill3, 10) : 0,
    skill4: skills.skill4 ? parseInt(skills.skill4, 10) : 0,
  };
};

export const deleteSkillsFromRedis = async (nickname) => {
  const key = `${SKILL_KEY}:${nickname}`;
  await redisClient.del(key);
};
