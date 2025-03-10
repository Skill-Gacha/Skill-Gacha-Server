// src/handler/town/sDespawnHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import logger from '../../utils/log/logger.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';

export const sDespawnHandler = async (user) => {
  const sessionManager = serviceLocator.get(SessionManager);
  try {
    if (!user) {
      logger.error('sDespawnHandler: 유효한 유저가 아닙니다.');
    }

    const town = sessionManager.getTown();
    if (!town) {
      logger.error('sDespawnHandler: 타운 세션을 찾을 수 없습니다.');
    }

    town.removeUser(user.id);

    const despawnPayload = createResponse(PacketType.S_Despawn, {
      playerIds: [user.id],
    });

    // 타운 내 다른 사용자들에게 디스펜스 패킷 전송
    broadcastToSession(town, despawnPayload, user.id);

    logger.info(`유저 ${user.id}의 Despawn 패킷을 타운 세션에 전송하였습니다.`);
  } catch (error) {
    logger.error(`sDespawnHandler 에러 발생: ${error.message}`);
  }
};

const broadcastToSession = (session, payload, excludeUserId) => {
  session.users.forEach((targetUser) => {
    if (targetUser.id !== excludeUserId) {
      try {
        targetUser.socket.write(payload);
      } catch (error) {
        console.error(`Error sending packet to user ${targetUser.id}: ${error.message}`);
      }
    }
  });
};
