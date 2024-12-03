// src/handler/boss/cPlayerBossResponseHandler.js

import sessionManager from '#managers/sessionManager.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PacketType } from '../../constants/header.js';

const LEAVE_DUNGEON_RESPONSE_CODE = 0;

export const cPlayerBossResponseHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);
  const responseCode = payload.responseCode || LEAVE_DUNGEON_RESPONSE_CODE;
  if (!user) {
    console.error('cPlayerPvpResponseHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  const bossRoom = sessionManager.getBossRoomByUser(user);
  if (!bossRoom) {
    console.error('cPlayerBossResponseHandler: 유저가 BOSSROOM 세션에 속해 있지 않습니다.');
    return;
  }

  if (responseCode === LEAVE_DUNGEON_RESPONSE_CODE) {
    socket.write(createResponse(PacketType.S_LeaveDungeon, {}));
    bossRoom.removeUser(user);
    const remainingUsers = bossRoom.getUsers();
    if (remainingUsers.length === 0) sessionManager.removeBossRoom(bossRoom.sessionId);
    return;
  }

  if (bossRoom.userTurn !== user) {
    console.error('cPlayerBossResponseHandler: 현재 차례가 아닌 유저의 응답입니다.');
    return;
  }

  // 보스룸에 있는 모든 유저에게 턴 정보 전송
  const bossUsers = bossRoom.getUsers();
  bossUsers.forEach((user) => {
    user.socket.write(createResponse(PacketType.S_BossUserTurn, { plyerId: bossRoom.userTurn.id }));
  });

  if (!bossRoom.currentState) {
    const BossActionState = (await import('./states/bossActionState.js')).default;
    bossRoom.currentState = new BossActionState(bossRoom);
    await bossRoom.currentState.enter();
  }

  await bossRoom.currentState.handleInput(responseCode);
};
