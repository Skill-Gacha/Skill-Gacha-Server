// src/db/item/itemDb.js

import dbPool from '../database.js';
import { ITEM_QUERIES } from './itemQueries.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import logger from '../../utils/log/logger.js';

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
    logger.error('itemDb: DB에서 아이템 정보 가져오기 실패');
    throw new CustomError(ErrorCodes.FETCH_ITEM_DATA_FROM_DB_FAILED, error);
  }
};

export const saveItemToDB = async (nickname, itemId, count) => {
  try {
    await dbPool.query(ITEM_QUERIES.INSERT_OR_UPDATE_ITEM, [nickname, itemId, count, count]);
  } catch (error) {
    logger.error('itemDb: DB에 아이템 저장 실패.');
    throw new CustomError(ErrorCodes.SAVE_ITEM_DATA_TO_DB_FAILED, error);
  }
};
