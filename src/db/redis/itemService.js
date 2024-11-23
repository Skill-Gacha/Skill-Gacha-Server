// src/db/redis/itemService.js

import redisClient from '../../init/redis.js';

const ITEM_KEY = 'items';

// 아이템 데이터를 Redis에 저장
export const saveItemsToRedis = async (nickname, items) => {
  const key = `${ITEM_KEY}:${nickname}`;
  // 모든 아이템 값을 문자열로 저장
  const stringItems = {};
  for (const [k, v] of Object.entries(items)) {
    stringItems[k] = v.toString();
  }
  await redisClient.hSet(key, stringItems);
};

// 아이템 데이터를 Redis에서 가져옴
export const getItemsFromRedis = async (nickname) => {
  const key = `${ITEM_KEY}:${nickname}`;
  const items = await redisClient.hGetAll(key);
  if (Object.keys(items).length === 0) return null;
  const parsedItems = {};
  for (let i = 1; i <= 5; i++) {
    const itemKey = `item${i}`;
    parsedItems[itemKey] = items[itemKey] ? parseInt(items[itemKey], 10) : 0;
  }
  return parsedItems;
};

// 특정 아이템의 개수를 Redis에서 업데이트합니다.
export const updateItemCountInRedis = async (nickname, itemId, delta) => {
  const key = `${ITEM_KEY}:${nickname}`;
  const itemField = `item${itemId}`;
  const newCount = await redisClient.hIncrBy(key, itemField, delta);
  if (newCount < 0) {
    // 아이템 개수가 음수가 되지 않도록 조정
    await redisClient.hSet(key, itemField, '0');
    return 0;
  }
  return newCount;
};

// 아이템 데이터를 Redis에서 제거
export const deleteItemsFromRedis = async (nickname) => {
  const key = `${ITEM_KEY}:${nickname}`;
  await redisClient.del(key);
};
