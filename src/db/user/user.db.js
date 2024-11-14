// src/db/user/user.db.js

import { toCamelCase } from '../../utils/transformCase.js';
import dbPool from '../database.js';
import { USER_QUERIES } from './user.queries.js';

export const updateUserLocation = async (x, y, deviceId) => {
  await dbPool.query(USER_QUERIES.UPDATE_USER_LOCATION, [x, y, deviceId]);
};

export const findUserNickname = async (nickname) => {
  const [rows] = await dbPool.query(USER_QUERIES.FIND_USER_BY_NICKNAME, [nickname]);
  return toCamelCase(rows[0]);
};

export const createUser = async (nickname, job) => {
  await dbPool.query(USER_QUERIES.CREATE_USER, [nickname, job]);
  return { nickname, job };
};

export const updateUserLogin = async (id) => {
  await dbPool.query(USER_QUERIES.UPDATE_USER_LOGIN, [id]);
};

export const findServerHighScore = async () => {
  const highScore = await dbPool.query(USER_QUERIES.FIND_HIGH_SCORE);
  return highScore[0][0].highScore;
};
