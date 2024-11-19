// src/db/user/user.db.js

import { toCamelCase } from '../../utils/transformCase.js';
import dbPool from '../database.js';
import { USER_QUERIES } from './user.queries.js';

export const findUserNickname = async (nickname) => {
  const [rows] = await dbPool.query(USER_QUERIES.FIND_USER_BY_NICKNAME, [nickname]);
  if (rows.length === 0) return null;
  return toCamelCase(rows[0]);
};

export const createUser = async (nickname, element, maxhp, maxmp, gold = 0, stone = 0) => {
  await dbPool.query(USER_QUERIES.CREATE_USER, [
    nickname,
    element,
    maxhp,
    maxmp,
    gold,
    stone,
  ]);
  return { nickname, element, maxhp, maxmp, gold, stone };
};
