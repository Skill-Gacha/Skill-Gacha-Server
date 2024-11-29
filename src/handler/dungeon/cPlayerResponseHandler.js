// src/handler/dungeon/cPlayerResponseHandler.js

import sessionManager from '#managers/sessionManager.js';
import { handleError } from '../../utils/error/errorHandler.js';

export const cPlayerResponseHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);

  if (!user) {
    console.error('cPlayerResponseHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  const dungeon = sessionManager.getDungeonByUser(user);

  if (!dungeon) {
    console.error('cPlayerResponseHandler: 유저가 던전 세션에 속해 있지 않습니다.');
    return;
  }

  if (!dungeon.currentState) {
    // 초기 상태 설정
    const initializedDungeonState = await initializeDungeonState(dungeon, user, socket);
    if (!initializedDungeonState) return;
  }

  const responseCode = payload.responseCode !== undefined ? payload.responseCode : 0;

  try {
    await dungeon.currentState.handleInput(responseCode);
  } catch (error) {
    console.error('cPlayerResponseHandler: 처리 중 오류 발생:', error);
    handleError(error);
  }
};

const initializeDungeonState = async (dungeon, user, socket) => {
  try {
    const MessageState = (await import('./states/messageState.js')).default;
    dungeon.currentState = new MessageState(dungeon, user, socket);
    await dungeon.currentState.enter();
    return true;
  } catch (error) {
    console.error('cPlayerResponseHandler: 초기 상태 설정 중 오류 발생:', error);
    handleError(error);
    return false;
  }
};
