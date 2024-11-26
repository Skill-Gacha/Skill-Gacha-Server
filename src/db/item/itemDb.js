// src/db/item/itemDb.js

import dbPool from '../database.js';
import { ITEM_QUERIES } from './itemQueries.js';

export const getItemsFromDB = async (nickname) => {
  try {
    const [rows] = await dbPool.query(ITEM_QUERIES.GET_ITEMS_BY_NICKNAME, [nickname]);
    if (rows.length === 0) return null;

    const itemsArray = [];
    for (let i = 4001; i <= 4005; i++) {
      const row = rows.find((r) => r.item_id === i);
      itemsArray.push({
        itemId: i,
        count: row ? row.count : 0,
      });
    }
    return itemsArray;
  } catch (error) {
    console.error('itemDb: DB에서 아이템 정보 가져오기 실패:', error);
    throw error;
  }
};

export const saveItemToDB = async (nickname, itemId, count) => {
  try {
    await dbPool.query(ITEM_QUERIES.INSERT_OR_UPDATE_ITEM, [nickname, itemId, count, count]);
  } catch (error) {
    console.error('itemDb: DB에 아이템 저장 실패:', error);
    throw error;
  }
};
