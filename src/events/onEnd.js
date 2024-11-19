// src/events/onEnd.js

import { sDespawnHandler } from '../handler/town/sDespawnHandler.js';
import sessionManager from '#managers/sessionManager.js';
import { saveSkillsToDB } from '../db/skill/skillDb.js';
import { deleteSkillsFromRedis, getPlayerRatingFromRedis, getSkillsFromRedis } from '../db/redis/skillService.js';
import { saveRatingToDB } from '../db/rating/ratingDb.js';

export const onEnd = (socket) => async () => {
  console.log('클라이언트 연결이 종료되었습니다.');

  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('onEnd: 유저를 찾을 수 없습니다.');
    return;
  }

  const nickname = user.nickname;

  try {
    // DB에 스킬 저장
    const skills = await getSkillsFromRedis(nickname);
    if (skills) {
      await saveSkillsToDB(nickname, skills);
      console.log(`Skills for ${nickname} saved to DB.`);
    } else {
      console.warn(`No skills found in Redis for ${nickname}.`);
    }

    // DB에 레이팅 저장
    const rating = await getPlayerRatingFromRedis(nickname);
    if (rating !== null) {
      await saveRatingToDB(nickname, rating);
      console.log(`Rating for ${nickname} saved to DB.`);
    } else {
      console.warn(`No rating found in Redis for ${nickname}.`);
    }

    // DB에 저장이 완료되면 레디스에서도 제거
    await deleteSkillsFromRedis(nickname);
    console.log(`${nickname}'s skills and rating removed from Redis.`);
  } catch (error) {
    console.error(`Error during user logout for ${nickname}:`, error);
  }

  try {
    // 디스펜스 처리 (타운 세션에만)
    await sDespawnHandler(user);

    // 모든 세션에서 사용자 제거
    sessionManager.removeUser(user.id);

    console.log(`유저 ${user.id}가 세션에서 제거되었습니다.`);
  } catch (error) {
    console.error('onEnd 처리 중 오류 발생:', error);
    // 추가적인 에러 핸들링 필요 시 추가
  }
};
