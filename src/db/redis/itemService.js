// src/db/redis/itemService.js

import redisClient from '../../init/redis.js';

const ITEM_KEY = 'items';

// 아이템 데이터를 Redis에 저장
export const saveItemsToRedis = async (nickname, items) => {
  const key = `${ITEM_KEY}:${nickname}`;
  // 아이템 배열을 해시 필드로 변환
  const stringItems = {};

  for (const item of items) {
    stringItems[`item${item.itemId}`] = item.count.toString();
  }

  await redisClient.hSet(key, stringItems);
};

// 아이템 데이터를 Redis에서 가져옴
export const getItemsFromRedis = async (nickname) => {
  const key = `${ITEM_KEY}:${nickname}`;
  const itemsHash = await redisClient.hGetAll(key);
  if (Object.keys(itemsHash).length === 0) return null;

  const itemsArray = [];
  for (let i = 4001; i <= 4005; i++) {
    const itemKey = `item${i}`;
    itemsArray.push({
      itemId: i,
      count: itemsHash[itemKey] ? parseInt(itemsHash[itemKey], 10) : 0
    });
  }
  return itemsArray;
};

// 특정 아이템의 개수를 Redis에서 업데이트
export const updateItemCountInRedis = async (nickname, itemId, delta) => {
  if (itemId < 4001 || itemId > 4005) {
    throw new Error('itemId는 4001 이상 4005 이하이어야 합니다.');
  }

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

// 신규 캐릭터 대상 아이템 정보 초기화
export const initializeItems = () => {
  const initialItems = [];
  for (let i = 4001; i <= 4005; i++) {
    initialItems.push({ itemId: i, count: 0 });
  }
  return initialItems;
};
