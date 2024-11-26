// src/db/skill/skillDb.js

import dbPool from '../database.js';
import { SKILL_QUERIES } from './skillQueries.js';

export const getSkillsFromDB = async (nickname) => {
  try {
    const [rows] = await dbPool.query(SKILL_QUERIES.GET_SKILLS_BY_NICKNAME, [nickname]);
    if (rows.length === 0) return null;
    const { skill1, skill2, skill3, skill4 } = rows[0];
    return { skill1, skill2, skill3, skill4 };
  } catch (error) {
    console.error('skillDb: DB에서 스킬 정보 가져오기 실패:', error);
    throw error;
  }
};

export const saveSkillsToDB = async (nickname, skills) => {
  const { skill1, skill2, skill3, skill4 } = skills;
  try {
    await dbPool.query(SKILL_QUERIES.SAVE_SKILLS, [nickname, skill1, skill2, skill3, skill4]);
  } catch (error) {
    console.error('skillDb: DB에 스킬 저장 실패:', error);
    throw error;
  }
};
