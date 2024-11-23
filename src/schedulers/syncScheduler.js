// src/schedulers/syncScheduler.js

import cron from 'node-cron';
import redisClient from '../init/redis.js';
import { saveSkillsToDB } from '../db/skill/skillDb.js';
import { syncRatingsToDB } from '../sync/syncRatings.js';

const SYNC_INTERVAL_IN_MIN = 5;

// 모든 플레이어의 스킬 ID 정보를 MySQL에 동기화
const syncSkillsToDBTask = async () => {
  try {
    // 모든 스킬 키 가져오기
    const keys = await redisClient.keys('skills:*');
    const syncPromises = keys.map(async (key) => {
      const nickname = key.split(':')[1];
      const skills = await redisClient.hGetAll(key);
      if (Object.keys(skills).length) {
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
    console.log('스킬 정보가 성공적으로 DB에 저장되었습니다.');
  } catch (error) {
    console.error('스킬 동기화 중 에러 발생:', error);
  }
};

// 모든 플레이어의 레이팅 정보를 MySQL에 동기화
const syncRatingsToDBTask = async () => {
  try {
    await syncRatingsToDB();
  } catch (error) {
    console.error('레이팅 동기화 중 에러 발생:', error);
  }
};

// 모든 플레이어의 아이템 정보를 MySQL에 동기화
const syncItemsToDBTask = async () => {
  try {
    // 모든 아이템 키 가져오기
    const keys = await redisClient.keys('items:*');
    const syncPromises = keys.map(async (key) => {
      const nickname = key.split(':')[1];
      const items = await redisClient.hGetAll(key);
      if (Object.keys(items).length) {
        // 각 아이템에 대해 MySQL에 저장
        const saveItemPromises = Object.entries(items).map(async ([itemKey, count]) => {
          const itemId = parseInt(itemKey.replace('item', ''), 10);
          const itemCount = parseInt(count, 10);
          await saveItemToDB(nickname, itemId, itemCount);
        });
        await Promise.all(saveItemPromises);
      }
    });
    await Promise.all(syncPromises);
    console.log('아이템 정보가 성공적으로 DB에 저장되었습니다.');
  } catch (error) {
    console.error('아이템 동기화 중 에러 발생:', error);
  }
};

// 동기화 작업을 스케줄러 실행
export const startSyncScheduler = () => {
  // 매 5분마다 실행
  cron.schedule(`*/${SYNC_INTERVAL_IN_MIN} * * * *`, async () => {
    console.log('동기화 작업 시작...');
    await syncSkillsToDBTask();
    await syncRatingsToDBTask();
    console.log('동기화 작업 완료');
  });

  console.log(`동기화 스케줄러가 시작되었습니다. (매 ${SYNC_INTERVAL_IN_MIN}분마다 실행)`);
};
