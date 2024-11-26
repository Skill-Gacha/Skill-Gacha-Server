// src/sync/syncItems.js

import redisClient from '../init/redis.js';
import { saveItemToDB } from '../db/item/itemDb.js';

export const syncItemsToDB = async () => {
  try {
    console.log('아이템 동기화 작업 시작...');

    const keys = await redisClient.keys('items:*');
    if (keys.length === 0) {
      console.log('동기화할 아이템 정보가 없습니다.');
      return;
    }

    const syncPromises = keys.map(async (key) => {
      const nickname = key.split(':')[1];
      const items = await redisClient.hGetAll(key);
      if (Object.keys(items).length > 0) {
        const saveItemPromises = Object.entries(items).map(async ([itemKey, count]) => {
          const itemId = parseInt(itemKey.replace('item', ''), 10);
          const itemCount = parseInt(count, 10);
          await saveItemToDB(nickname, itemId, itemCount);
        });
        await Promise.all(saveItemPromises);
      }
    });
    await Promise.all(syncPromises);

    console.log('아이템 동기화 작업 완료.');
  } catch (error) {
    console.error('syncItems: 아이템 동기화 중 에러 발생:', error);
  }
};
