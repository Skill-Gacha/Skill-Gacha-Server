// src/handler/pvp/cPlayerPvpResponseHandler.js

import sessionManager from '#managers/sessionManager.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PacketType } from '../../constants/header.js';
import logger from '../../utils/log/logger.js';
import { STATE_KEYS } from '../../constants/stateKeys.js';
import stateFactory from '../states/stateFactory.js';
import PvpFleeMessageState from './states/pvpFleeMessageState.js';
import PvpGameOverState from './states/pvpGameOverState.js';

const LEAVE_DUNGEON_RESPONSE_CODE = 0;

export const cPlayerPvpResponseHandler = async ({ socket, payload }) => {
  try {
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

    const isConfirmOrGameOver = [PvpFleeMessageState, PvpGameOverState].some(
      (StateClass) => pvpRoom.currentState instanceof StateClass,
    );

    if (!isConfirmOrGameOver && responseCode === LEAVE_DUNGEON_RESPONSE_CODE) {
      socket.write(createResponse(PacketType.S_LeaveDungeon, {}));
      sessionManager.removePvpRoom(pvpRoom.sessionId);
      return;
    }

    const [playerA, playerB] = Array.from(pvpRoom.users.values());
    const currentPlayer = pvpRoom.getUserTurn() === 0 ? playerB : playerA;

    if (currentPlayer.nickname !== user.nickname) {
      logger.error('cPlayerPvpResponseHandler: 현재 차례가 아닌 유저의 응답입니다.');
      return;
    }

    // 턴 정보 클라이언트에게 전송
    currentPlayer.socket.write(createResponse(PacketType.S_UserTurn, { userTurn: true }));

    const opponent = currentPlayer === playerA ? playerB : playerA;
    opponent.socket.write(createResponse(PacketType.S_UserTurn, { userTurn: false }));

    if (!pvpRoom.currentState) {
      // 예시: 'action' 키로 상태 생성
      const newState = await stateFactory.createState(STATE_KEYS.PVP_ACTION, pvpRoom, currentPlayer, opponent);
      pvpRoom.currentState = newState;
      await pvpRoom.currentState.enter();
    }

    sessionManager.handleUserActivity(user.id);
    await pvpRoom.currentState.handleInput(responseCode);
  } catch (error) {
    logger.error('cPlayerPvpResponseHandler: ', error);
  }
};
