// src/handlers/cAnimationHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '../../managers/SessionManager.js';

export const cAnimationHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('유저를 찾을 수 없습니다.');
    return;
  }

  const animationPayload = createResponse(PacketType.S_Animation, {
    playerId: user.id,
    animCode: payload.animCode,
  });

  const town = sessionManager.getTown();
  if (!town) {
    console.error('타운 세션을 찾을 수 없습니다.');
    return;
  }

  // 타운 내 모든 유저에게 패킷 전송
  town.users.forEach((targetUser) => {
    try {
      targetUser.socket.write(animationPayload);
    } catch (error) {
      console.error('S_Animation 패킷 전송중 오류 발생', error);
    }
        
  });
};
