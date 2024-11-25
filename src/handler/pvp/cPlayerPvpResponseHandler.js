// src/handler/pvp/cPlayerPvpResponseHandler.js

import sessionManager from '#managers/sessionManager.js';
import { handleError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PacketType } from '../../constants/header.js';

export const cPlayerPvpResponseHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);
  const responseCode = payload.responseCode || 0;

  if (!user) {
    console.error('cPlayerPvpResponseHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  const pvpRoom = sessionManager.getPvpByUser(user);

  if (!pvpRoom) {
    console.error('cPlayerPvpResponseHandler: 유저가 PVP 세션에 속해 있지 않습니다.');
    return;
  }

  const [playerA, playerB] = Array.from(pvpRoom.users.values());

  let mover, stopper;

  if (pvpRoom.getUserTurn() === 0) {
    mover = playerB;
    stopper = playerA;
  } else {
    mover = playerA;
    stopper = playerB;
  }

  if (stopper.socket === socket) {
    console.error('cPlayerPvpResponseHandler: 현재 차례가 아닌 유저의 응답입니다.');
    return;
  }

  // 턴 정보 클라이언트에게도 전송
  mover.socket.write(
    createResponse(PacketType.S_UserTurn, {
      userTurn: true,
    }),
  );

  stopper.socket.write(
    createResponse(PacketType.S_UserTurn, {
      userTurn: false,
    }),
  );

  if (!pvpRoom.currentState) {
    // 초기 상태 설정
    try {
      const PvpActionState = (await import('./states/pvpActionState.js')).default;
      pvpRoom.currentState = new PvpActionState(pvpRoom, mover, stopper);
      await pvpRoom.currentState.enter();
    } catch (error) {
      console.error('cPlayerPvpResponseHandler: 초기 상태 설정 중 오류 발생:', error);
      handleError(error);
      return;
    }
  }

  try {
    await pvpRoom.currentState.handleInput(responseCode);
  } catch (error) {
    console.error('cPlayerPvpResponseHandler: 처리 중 오류 발생:', error);
    handleError(error);
  }
};
