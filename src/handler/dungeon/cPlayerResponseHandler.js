// src/handlers/dungeon/cPlayerResponseHandler.js

import sessionManager from '#managers/SessionManager.js';
import { PacketType } from '../../constants/header.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';

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
    const MessageState = (await import('./states/messageState.js')).default;
    dungeon.currentState = new MessageState(dungeon, user, socket);
    await dungeon.currentState.enter();
  }

  try {
    await dungeon.currentState.handleInput(responseCode);
  } catch (error) {
    console.error('cPlayerResponseHandler 처리 중 오류 발생:', error);
    throw new CustomError(ErrorCodes.INVALID_PACKET, '패킷 처리 중 오류가 발생했습니다.');
  }
};
