// src/db/item/itemDb.js

import dbPool from '../database.js';
import { ITEM_QUERIES } from './itemQueries.js';

// MySQL에서 플레이어의 모든 아이템 정보를 가져옴.
export const getItemsFromDB = async (nickname) => {
  try {
    const [rows] = await dbPool.query(ITEM_QUERIES.GET_ITEMS_BY_NICKNAME, [nickname]);
    if (rows.length === 0) return null;
    const items = {};
    rows.forEach(({ item_id, count }) => {
      items[`item${item_id}`] = count;
    });
    return items;
  } catch (error) {
    console.error('DB에서 아이템 정보 가져오기 실패:', error);
    throw error;
  }
};

// MySQL에 플레이어의 특정 아이템 정보를 저장 또는 업데이트
export const saveItemToDB = async (nickname, itemId, count) => {
  try {
    await dbPool.query(ITEM_QUERIES.INSERT_OR_UPDATE_ITEM, [nickname, itemId, count]);
  } catch (error) {
    console.error('DB에 아이템 저장 실패:', error);
    throw error;
  }
};
