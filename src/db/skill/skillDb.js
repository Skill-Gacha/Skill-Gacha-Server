// src/db/skills/skillDb.js

import dbPool from '../database.js';
import { SKILL_QUERIES } from './skillQueries.js';

// MySQL에서 플레이어의 스킬 정보 가져오기
export const getSkillsFromDB = async (nickname) => {
  try {
    const [rows] = await dbPool.query(SKILL_QUERIES.GET_SKILLS_BY_NICKNAME, [nickname]);
    if (rows.length === 0) return null;
    const { skill1, skill2, skill3, skill4 } = rows[0];
    return { skill1, skill2, skill3, skill4 };
  } catch (error) {
    console.error('Error fetching skills from DB:', error);
    throw error;
  }
};

// MySQL에 플레이어의 스킬 정보 저장 또는 업데이트
export const saveSkillsToDB = async (nickname, skills) => {
  console.log('스킬 확인', skills);
  const { skill1, skill2, skill3, skill4 } = skills;
  try {
    await dbPool.query(SKILL_QUERIES.SAVE_SKILLS, [nickname, skill1, skill2, skill3, skill4]);
  } catch (error) {
    console.error('Error saving skills to DB:', error);
    throw error;
  }
};
