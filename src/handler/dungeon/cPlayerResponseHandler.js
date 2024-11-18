// src/handlers/dungeon/cPlayerResponseHandler.js

import sessionManager from '#managers/sessionManager.js';
import { handleError } from '../../utils/error/errorHandler.js';

export const cPlayerResponseHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);
  const dungeon = sessionManager.getDungeonByUser(user);
  const responseCode = payload.responseCode || 0;

  if (!user || !dungeon) {
    console.error('cPlayerResponseHandler: 유저 또는 던전 세션을 찾을 수 없습니다.');
    return;
  }

  if (!dungeon.currentState) {
    // 초기 상태 설정
    // 던전 입장 시 스크린 텍스트부터 표시되므로
    // 메세지 상태 핸들링이 필요하다
    // 따라서 상태 지정이 없을 때 messageState.js부터 로드

    // messageState.js을 동적으로 임포트하고
    // 모듈의 기본 내보내기(Default Export)를 가져옴
    // 동적 임포트는 모듈의 전체 네임스페이스를 반환하므로
    // default를 통해 필요한 것만 가져오게 함
    const messageState = (await import('./states/messageState.js')).default;
    dungeon.currentState = new messageState(dungeon, user, socket);
    await dungeon.currentState.enter();
  }

  // 초기 상황이 아니면 클라이언트 응답 처리로 넘어감
  try {
    await dungeon.currentState.handleInput(responseCode);
  } catch (error) {
    console.error('cPlayerResponseHandler 처리 중 오류 발생:', error);
    handleError(error);
  }
};
