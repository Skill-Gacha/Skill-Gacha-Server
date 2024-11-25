// src/events/onEnd.js

import { sDespawnHandler } from '../handler/town/sDespawnHandler.js';
import sessionManager from '#managers/sessionManager.js';
import { saveSkillsToDB } from '../db/skill/skillDb.js';
import { saveRatingToDB } from '../db/rating/ratingDb.js';
import { updateUserResource } from '../db/user/user.db.js';
import { deleteSkillsFromRedis, getSkillsFromRedis } from '../db/redis/skillService.js';
import { getPlayerRatingFromRedis } from '../db/redis/ratingService.js';
import { deleteItemsFromRedis, getItemsFromRedis } from '../db/redis/itemService.js';
import { saveItemToDB } from '../db/item/itemDb.js';

export const onEnd = (socket) => async () => {
  console.log('클라이언트 연결이 종료되었습니다.');

  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('onEnd: 유저를 찾을 수 없습니다.');
    return;
  }
  const { nickname, gold, stone } = user;

  try {
    // DB에 스킬 저장
    const skills = await getSkillsFromRedis(nickname);
    if (skills) {
      await saveSkillsToDB(nickname, skills);
    } else {
      console.warn(`onEnd: ${nickname}의 스킬을 찾을 수 없습니다.`);
    }

    // DB에 재화 저장
    await updateUserResource(nickname, gold, stone);

    // DB에 레이팅 저장
    const rating = await getPlayerRatingFromRedis(nickname);
    if (rating !== null) {
      await saveRatingToDB(nickname, rating);
    } else {
      console.warn(`onEnd: ${nickname}의 레이팅 정보를 찾을 수 없습니다.`);
    }

    // DB에 아이템 저장
    const items = await getItemsFromRedis(nickname);
    if (items && Array.isArray(items)) {
      for (const item of items) {
        // 각 아이템을 MySQL에 저장
        await saveItemToDB(nickname, item.itemId, item.count);
      }
    } else {
      console.warn(`onEnd: ${nickname}의 아이템 정보를 찾을 수 없습니다.`);
    }

    // DB에 저장이 완료되면 레디스에서도 제거
    await deleteSkillsFromRedis(nickname);
    await deleteItemsFromRedis(nickname);
  } catch (error) {
    console.error(`onEnd: ${nickname} 접속 종료 처리 중 문제 발생.`, error);
  }

  try {
    // 디스펜스 처리 (타운 세션에만)
    await sDespawnHandler(user);

    // 매칭큐 초기화
    sessionManager.removeMatchingQueue(user);

    // 모든 세션에서 사용자 제거
    sessionManager.removeUser(user.id);

    console.log(`유저 ${user.id}가 세션에서 제거되었습니다.`);
  } catch (error) {
    console.error('onEnd: 처리 중 오류 발생:', error);
    // 추가적인 에러 핸들링 필요 시 추가
  }
};
