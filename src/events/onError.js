// src/events/onError.js

import { sDespawnHandler } from '../handler/town/sDespawnHandler.js';
import sessionManager from '../managers/SessionManager.js';

export const onError = (socket) => async (err) => {
  console.error('소켓 에러 발생:', err);

  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('onError: 유저를 찾을 수 없습니다.');
    return;
  }

  try {
    // 디스펜스 처리 (타운 세션에만)
    await sDespawnHandler(user);

    // 모든 세션에서 사용자 제거
    sessionManager.removeUser(user.id);

    console.log(`유저 ${user.id}가 세션에서 제거되었습니다.`);
  } catch (error) {
    console.error('onError 처리 중 오류 발생:', error);
    // 추가적인 에러 핸들링 필요 시 추가
  }
};
