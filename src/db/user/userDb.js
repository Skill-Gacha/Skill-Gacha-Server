// src/db/user/user.db.js

import dbPool from '../database.js';
import { toCamelCase } from '../../utils/transformCase.js';
import { USER_QUERIES } from './userQueries.js';

export const findUserNickname = async (nickname) => {
  const [rows] = await dbPool.query(USER_QUERIES.FIND_USER_BY_NICKNAME, [nickname]);
  if (rows.length === 0) return null;
  return toCamelCase(rows[0]);
};

export const createUser = async (nickname, element, maxHp, maxMp, gold = 0, stone = 0) => {
  await dbPool.query(USER_QUERIES.CREATE_USER, [nickname, element, maxHp, maxMp, gold, stone]);
  return { nickname, element, maxHp, maxMp, gold, stone };
};

export const updateUserResource = async (nickname, gold, stone) => {
  await dbPool.query(USER_QUERIES.UPDATE_USER_RESOURCE, [gold, stone, nickname]);
};
