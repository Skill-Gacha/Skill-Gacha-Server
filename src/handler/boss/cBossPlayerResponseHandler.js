// src/handler/boss/cBossPlayerResponseHandler.js

import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';
import QueueManager from '#managers/queueManager.js';
import logger from '../../utils/log/logger.js';
import { sendBossLeaveDungeon } from '../../utils/battle/bossHelpers.js';

const LEAVE_DUNGEON_RESPONSE_CODE = 0;

export const cBossPlayerResponseHandler = async ({ socket, payload }) => {
  const sessionManager = serviceLocator.get(SessionManager);
  const queueManager = serviceLocator.get(QueueManager);
  const user = sessionManager.getUserBySocket(socket);
  const responseCode = payload.responseCode || LEAVE_DUNGEON_RESPONSE_CODE;

  if (!user) {
    logger.error('cBossPlayerResponseHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  const bossRoom = sessionManager.getBossRoomByUser(user);
  if (!bossRoom) {
    logger.error('cBossPlayerResponseHandler: 유저가 BOSSROOM 세션에 속해 있지 않습니다.');
    return;
  }

  if (responseCode === LEAVE_DUNGEON_RESPONSE_CODE) {
    sendBossLeaveDungeon(user);
    bossRoom.removeUser(user);
    user.setMatched(false); // 매칭 상태 해제
    const remainingUsers = bossRoom.getUsers();
    if (remainingUsers.length === 0) sessionManager.removeBossRoom(bossRoom.sessionId);
    return;
  }

  if (bossRoom.userTurn !== user) {
    logger.error('cBossPlayerResponseHandler: 현재 차례가 아닌 유저의 응답입니다.');
    return;
  }

  sessionManager.handleUserActivity(user.id);
  await bossRoom.currentState.handleInput(responseCode);
};
