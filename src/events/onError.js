// src/events/onError.js

import { sDespawnHandler } from '../handler/town/sDespawnHandler.js';
import sessionManager from '#managers/sessionManager.js';

export const onError = (socket) => async (err) => {
  console.error('onError: 소켓 에러 발생:', err);

  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('onError: 유저를 찾을 수 없습니다.');
    return;
  }

  try {
    await sDespawnHandler(user);

    // 매칭큐 초기화
    sessionManager.removeMatchingQueue(user);

    // 모든 세션에서 사용자 제거
    sessionManager.removeUser(user.id);

    console.log(`onError: 유저 ${user.id}가 세션에서 제거되었습니다.`);
  } catch (error) {
    console.error('onError: 처리 중 오류 발생:', error);
    // 추가적인 에러 핸들링 필요 시 추가
  }
};
