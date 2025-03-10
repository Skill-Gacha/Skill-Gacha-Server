// src/handler/pvp/cPlayerPvpResponseHandler.js

import { createResponse } from '../../utils/response/createResponse.js';
import { PacketType } from '../../constants/header.js';
import logger from '../../utils/log/logger.js';
import { STATE_KEYS } from '../../constants/stateKeys.js';
import stateFactory from '../states/stateFactory.js';
import PvpGameOverState from './states/result/pvpGameOverState.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';
import { LEAVE_DUNGEON_RESPONSE_CODE } from '../../constants/pvp.js';

export const cPlayerPvpResponseHandler = async ({ socket, payload }) => {
  const sessionManager = serviceLocator.get(SessionManager);
  const user = sessionManager.getUserBySocket(socket);
  const responseCode = payload.responseCode || LEAVE_DUNGEON_RESPONSE_CODE;

  if (!user) {
    logger.error('cPlayerPvpResponseHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  const pvpRoom = sessionManager.getPvpByUser(user);
  if (!pvpRoom) {
    logger.error('cPlayerPvpResponseHandler: 유저가 PVP 세션에 속해 있지 않습니다.');
    return;
  }

  const isConfirmOrGameOver = pvpRoom.currentState instanceof PvpGameOverState;

  if (!isConfirmOrGameOver && responseCode === LEAVE_DUNGEON_RESPONSE_CODE) {
    pvpRoom.users.forEach((u) => u.socket.write(createResponse(PacketType.S_LeaveDungeon, {})));
    sessionManager.removePvpRoom(pvpRoom.sessionId);
    return;
  }

  let currentPlayer, opponent;
  if (!isConfirmOrGameOver) {
    const [playerA, playerB] = Array.from(pvpRoom.users.values());
    currentPlayer = (pvpRoom.getUserTurn() === 0) ? playerA : playerB;

    if (currentPlayer.nickname !== user.nickname) {
      logger.error('cPlayerPvpResponseHandler: 현재 차례가 아닌 유저의 응답입니다.');
      return;
    }

    currentPlayer.socket.write(createResponse(PacketType.S_UserTurn, { userTurn: true }));
    opponent = (currentPlayer === playerA) ? playerB : playerA;
    opponent.socket.write(createResponse(PacketType.S_UserTurn, { userTurn: false }));
  }

  if (!pvpRoom.currentState) {
    const newState = await stateFactory.createState(STATE_KEYS.PVP_ACTION, pvpRoom, currentPlayer, opponent);
    pvpRoom.currentState = newState;
    await pvpRoom.currentState.enter();
  }

  sessionManager.handleUserActivity(user.id);
  await pvpRoom.currentState.handleInput(responseCode);
};
