// src/handler/boss/cBossMatchHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { MAX_PLAYER } from '../../constants/boss.js';

export const cBossMatchHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);
  const isInPortal = payload.isIn;

  if (!user) {
    console.error('cPlayerMatchHandler: 유저가 존재하지 않습니다.');
    return;
  }

  try {
    // 포탈에 들어왔을 때 처리
    if (isInPortal) {
      const matchedPlayers = sessionManager.addMatchingQueue(user, MAX_PLAYER, 'boss');
      if (!matchedPlayers) return;

      // 수락 여부 묻기
      matchedPlayers.forEach((user) => {
        user.socket.write(createResponse(PacketType.S_AcceptRequest, {}));
      });
    }

    // 포탈에서 나갔을 때 처리
    else {
      sessionManager.removeMatchingQueue(user, 'boss');
    }
  } catch (error) {
    console.error('cBossMatchHandler: 잘못된 payload 값입니다.');
  }
};
