// src/services/skillDb.js

import dbPool from '../database.js';
import { RATING_QUERIES } from './ratingQueries.js';


// MySQL에 레이팅 저장
export const saveRatingToDB = async (nickname, rating) => {
  try {
    await dbPool.query(
      RATING_QUERIES.SAVE_RATING,
      [nickname, rating],
    );
  } catch (error) {
    console.error('DB에 레이팅 정보 저장 실패:', error);
    throw error;
  }
};

// MySQL에서 레이팅 로드
export const getRatingFromDB = async (nickname) => {
  try {
    const [rows] = await dbPool.query(RATING_QUERIES.GET_RATING_BY_NICKNAME, [nickname]);
    if (rows.length === 0) return null;
    return rows[0].rating;
  } catch (error) {
    console.error('DB에서 레이팅 정보 가져오기 실패:', error);
    throw error;
  }
};