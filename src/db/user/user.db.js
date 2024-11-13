// src/db/user/user.db.js

import { toCamelCase } from '../../utils/transformCase.js';
import dbPool from '../database.js';
import { USER_QUERIES } from './user.queries.js';

export const updateUserLocation = async (x, y, deviceId) => {
  await dbPool.query(USER_QUERIES.UPDATE_USER_LOCATION, [x, y, deviceId]);
};

export const findUserId = async (id) => {
  const [rows] = await dbPool.query(USER_QUERIES.FIND_USER_BY_ID, [id]);
  return toCamelCase(rows[0]);
};

export const createUser = async (id, email, password) => {
  await dbPool.query(USER_QUERIES.CREATE_USER, [id, email, password]);
  return { id, email, password };
};

export const updateUserLogin = async (id) => {
  await dbPool.query(USER_QUERIES.UPDATE_USER_LOGIN, [id]);
};

export const findServerHighScore = async () => {
  const highScore = await dbPool.query(USER_QUERIES.FIND_HIGH_SCORE);
  return highScore[0][0].highScore;
};
