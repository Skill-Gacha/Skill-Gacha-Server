// src/sync/syncSkillsToDB.js

import redisClient from '../init/redis.js';
import { saveSkillsToDB } from '../db/skill/skillDb.js';

export const syncSkillsToDB = async () => {
  try {
    console.log('스킬 동기화 작업 시작...');

    const keys = await redisClient.keys('skills:*');
    if (keys.length === 0) {
      console.log('동기화할 스킬 정보가 없습니다.');
      return;
    }

    const syncPromises = keys.map(async (key) => {
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
    });
    await Promise.all(syncPromises);

    console.log('스킬 동기화 작업 완료.');
  } catch (error) {
    console.error('syncSkills: 스킬 동기화 중 에러 발생:', error);
  }
};
