// src/handler/town/cAnimationHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '#managers/sessionManager.js';
import logger from '../../utils/log/logger.js';

export const cAnimationHandler = async ({ socket, payload }) => {
  try {
    const user = sessionManager.getUserBySocket(socket);
    if (!user) {
      logger.error('cAnimationHandler: 유저를 찾을 수 없습니다.');
    }

    const town = sessionManager.getTown();
    if (!town) {
      logger.error('cAnimationHandler: 타운 세션을 찾을 수 없습니다.');
    }

    const animationPayload = createResponse(PacketType.S_Animation, {
      playerId: user.id,
      animCode: payload.animCode,
    });

    // 타운 내 모든 유저에게 패킷 전송
    broadcastToTown(town, animationPayload);
  } catch (error) {
    logger.error(`cAnimationHandler Error: ${error.message}`);
  }
};

const broadcastToTown = (town, payload) => {
  town.users.forEach((targetUser) => {
    try {
      targetUser.socket.write(payload);
    } catch (error) {
      logger.error(`cAnimationHandler: S_Animation 패킷 전송 중 오류 발생: ${targetUser.id}: ${error.message}`);
    }
  });
};
