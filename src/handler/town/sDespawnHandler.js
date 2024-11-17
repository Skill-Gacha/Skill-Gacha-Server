// src/handlers/sDespawnHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '#managers/SessionManager.js';
import { handleError } from '../../utils/error/errorHandler.js';

export const sDespawnHandler = async (user) => {
  if (!user) {
    console.error('sDespawnHandler: 유저 객체가 없습니다.');
    return;
  }

  const despawnedUserIds = [user.id];

  try {
    const town = sessionManager.getTown();
    if (!town) {
      throw new Error('타운 세션을 찾을 수 없습니다.');
    }

    town.removeUser(user.id);

    const despawnPayload = createResponse(PacketType.S_Despawn, {
      playerIds: despawnedUserIds,
    });

    // 타운 내 다른 사용자들에게 디스펜스 패킷 전송
    sessionManager.broadcastToSession(town, despawnPayload, user.id);

    console.log(`유저 ${user.id}의 Despawn 패킷을 타운 세션에 전송하였습니다.`);
  } catch (error) {
    console.error('sDespawnHandler 처리 중 오류 발생:', error);
    handleError(user.socket, error);
  }
};
