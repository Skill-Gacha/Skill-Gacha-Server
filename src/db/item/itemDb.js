// src/db/item/itemDb.js

import dbPool from '../database.js';
import { ITEM_QUERIES } from './itemQueries.js';

// MySQL에서 플레이어의 모든 아이템 정보를 가져옴
export const getItemsFromDB = async (nickname) => {
  try {
    const [rows] = await dbPool.query(ITEM_QUERIES.GET_ITEMS_BY_NICKNAME, [nickname]);
    if (rows.length === 0) return null;

    // 모든 아이템을 포함하는 배열을 생성 (아이템 ID 4001~4005)
    const itemsArray = [];
    for (let i = 4001; i <= 4005; i++) {
      const row = rows.find(r => r.item_id === i);
      itemsArray.push({
        itemId: i,
        count: row ? row.count : 0
      });
    }
    return itemsArray;
  } catch (error) {
    console.error('DB에서 아이템 정보 가져오기 실패:', error);
    throw error;
  }
};

// MySQL에 플레이어의 특정 아이템 정보를 저장 또는 업데이트
export const saveItemToDB = async (nickname, itemId, count) => {
  try {
    await dbPool.query(ITEM_QUERIES.INSERT_OR_UPDATE_ITEM, [nickname, itemId, count, count]);
  } catch (error) {
    console.error('DB에 아이템 저장 실패:', error);
    throw error;
  }
};
