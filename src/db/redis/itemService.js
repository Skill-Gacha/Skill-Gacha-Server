// src/db/redis/itemService.js

import redisClient from '../../init/redis.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';

const ITEM_KEY = 'items';

export const saveItemsToRedis = async (nickname, items) => {
  const key = `${ITEM_KEY}:${nickname}`;
  const stringItems = {};

  for (const item of items) {
    stringItems[`item${item.itemId}`] = item.count.toString();
  }

  await redisClient.hSet(key, stringItems);
};

export const getItemsFromRedis = async (nickname) => {
  const key = `${ITEM_KEY}:${nickname}`;
  const itemsHash = await redisClient.hGetAll(key);
  if (Object.keys(itemsHash).length === 0) return null;

  const itemsArray = [];
  for (let i = 4001; i <= 4005; i++) {
    const itemKey = `item${i}`;
    itemsArray.push({
      itemId: i,
      count: itemsHash[itemKey] ? parseInt(itemsHash[itemKey], 10) : 0,
    });
  }
  return itemsArray;
};

export const updateItemCountInRedis = async (nickname, itemId, delta) => {
  if (itemId < 4001 || itemId > 4005) {
    throw new CustomError(ErrorCodes.OUT_OF_RANGE, 'itemId는 4001 이상 4005 이하이어야 합니다.');
  }

  const key = `${ITEM_KEY}:${nickname}`;
  const itemField = `item${itemId}`;
  const newCount = await redisClient.hIncrBy(key, itemField, delta);

  if (newCount < 0) {
    await redisClient.hSet(key, itemField, '0');
    return 0;
  }

  return newCount;
};

export const deleteItemsFromRedis = async (nickname) => {
  const key = `${ITEM_KEY}:${nickname}`;
  await redisClient.del(key);
};

export const initializeItems = () => {
  const initialItems = [];
  for (let i = 4001; i <= 4005; i++) {
    initialItems.push({ itemId: i, count: 0 });
  }
  return initialItems;
};
