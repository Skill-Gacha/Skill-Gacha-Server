// src/sync/syncSkills.js

import redisClient from '../init/redis.js';
import { saveSkillsToDB } from '../db/skill/skillDb.js';
import logger from '../utils/log/logger.js';
import pLimit from 'p-limit';

export const syncSkillsToDB = async () => {
  try {
    logger.info('스킬 동기화 작업 시작...');

    const keys = await redisClient.keys('skills:*');
    if (keys.length === 0) {
      logger.info('동기화할 스킬 정보가 없습니다.');
      return;
    }

    // 동시 실행 개수 제한 설정
    const limit = pLimit(100);

    const syncPromises = keys.map((key) =>
      limit(async () => {
        const nickname = key.split(':')[1];
        const skills = await redisClient.hGetAll(key);
        if (Object.keys(skills).length > 0) {
          const parsedSkills = {
            skill1: skills.skill1 ? parseInt(skills.skill1, 10) : null,
            skill2: skills.skill2 ? parseInt(skills.skill2, 10) : null,
            skill3: skills.skill3 ? parseInt(skills.skill3, 10) : null,
            skill4: skills.skill4 ? parseInt(skills.skill4, 10) : null,
          };
          await saveSkillsToDB(nickname, parsedSkills);
        }
      }),
    );

    // 모든 제한된 비동기 작업 완료 대기
    await Promise.all(syncPromises);

    logger.info('스킬 동기화 작업 완료.');
  } catch (error) {
    logger.error('syncSkills: 스킬 동기화 중 에러 발생:', error);
  }
};
