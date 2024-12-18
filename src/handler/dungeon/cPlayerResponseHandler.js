﻿// src/handler/dungeon/cPlayerResponseHandler.js

import sessionManager from '#managers/sessionManager.js';
import { handleError } from '../../utils/error/errorHandler.js';
import logger from '../../utils/log/logger.js';
import { STATE_KEYS } from '../../constants/stateKeys.js';
import stateFactory from '../states/stateFactory.js';

export const cPlayerResponseHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);

  if (!user) {
    logger.error('cPlayerResponseHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  const dungeon = sessionManager.getDungeonByUser(user);

  if (!dungeon) {
    logger.error('cPlayerResponseHandler: 유저가 던전 세션에 속해 있지 않습니다.');
    return;
  }

  if (!dungeon.currentState) {
    // 초기 상태 설정을 팩토리를 통해 수행
    const initializedDungeonState = await initializeDungeonState(dungeon, user, socket);
    if (!initializedDungeonState) return;
  }

  const responseCode = payload.responseCode !== undefined ? payload.responseCode : 0;

  sessionManager.handleUserActivity(user.id);
  try {
    await dungeon.currentState.handleInput(responseCode);
  } catch (error) {
    logger.error('cPlayerResponseHandler: 처리 중 오류 발생:', error);
    handleError(error);
  }
};

const initializeDungeonState = async (dungeon, user, socket) => {
  try {
    // 팩토리를 통해 상태 생성
    const newState = await stateFactory.createState(STATE_KEYS.MESSAGE, dungeon, user, socket);
    dungeon.currentState = newState;
    await dungeon.currentState.enter();
    return true;
  } catch (error) {
    logger.error('cPlayerResponseHandler: 초기 상태 설정 중 오류 발생:', error);
    handleError(error);
    return false;
  }
};
