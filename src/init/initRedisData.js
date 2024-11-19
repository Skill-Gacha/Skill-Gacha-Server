﻿// src/init/initializeRedis.js

import dbPool from '../db/database.js';
import redisClient from './redis.js';
import { USER_QUERIES } from '../db/user/user.queries.js';
import { SKILL_QUERIES } from '../db/skill/skillQueries.js';
import { RATING_QUERIES } from '../db/rating/ratingQueries.js';

// 초기화 함수
const initializeRedis = async () => {
  try {
    console.log('Redis 초기화 시작...');

    // 모든 유저의 닉네임을 가져옵니다.
    const [users] = await dbPool.query(USER_QUERIES.GET_ALL_USERNICKNAMES);
    console.log(`총 유저 수: ${users.length}`);

    // 각 유저의 스킬과 레이팅을 병렬로 처리
    await Promise.all(users.map(async (user) => {
      const nickname = user.nickname;

      try {
        // 스킬 정보 가져오기
        const [skillsRows] = await dbPool.query(SKILL_QUERIES.GET_SKILLS_BY_NICKNAME, [nickname]);
        if (skillsRows.length > 0) {
          const skills = skillsRows[0];
          const skillsData = {
            skill1: skills.skill1 || 0,
            skill2: skills.skill2 || 0,
            skill3: skills.skill3 || 0,
            skill4: skills.skill4 || 0,
          };

          // Redis에 스킬 정보 저장 (Hash)
          const skillKey = `skills:${nickname}`;
          await redisClient.hSet(skillKey, skillsData);
          console.log(`Redis에 스킬 정보 저장: ${skillKey}`);
        } else {
          console.warn(`유저 ${nickname}의 스킬 정보를 찾을 수 없습니다.`);
        }

        // 레이팅 정보 가져오기
        const [ratingRows] = await dbPool.query(RATING_QUERIES.GET_RATING_BY_NICKNAME, [nickname]);
        if (ratingRows.length > 0) {
          const rating = ratingRows[0].rating;

          // Redis에 레이팅 정보 저장 (Sorted Set)
          const ratingKey = 'pvp_rating';
          await redisClient.zAdd(ratingKey, {
            score: rating,
            value: nickname,
          });
          console.log(`Redis에 레이팅 정보 저장: ${nickname} (레이팅: ${rating})`);
        } else {
          console.warn(`유저 ${nickname}의 레이팅 정보를 찾을 수 없습니다.`);
        }
      } catch (userError) {
        console.error(`유저 ${nickname} 초기화 중 오류 발생:`, userError);
      }
    }));

    console.log('Redis 초기화 완료.');
  } catch (error) {
    console.error('Redis 초기화 중 오류 발생:', error);
  }
};