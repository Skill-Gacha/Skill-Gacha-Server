// src/handler/town/sSpawnHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '#managers/sessionManager.js';
import { playerData } from '../../utils/packet/playerPacket.js';
import logger from '../../utils/log/logger.js';

export const sSpawnHandler = async (newUser) => {
  try {
    const session = sessionManager.getSessionByUserId(newUser.id);
    if (!session) {
      logger.error('sSpawnHandler: 사용자가 속한 세션을 찾을 수 없습니다.');
    }

    // 새로운 사용자 정보 생성
    const newPlayerData = playerData(newUser);

    // S_Spawn 응답 생성
    const spawnResponse = createResponse(PacketType.S_Spawn, { players: [newPlayerData] });

    // 기존 사용자들에게 전송 (자신을 제외)
    broadcastToSession(session, spawnResponse, newUser.id);
  } catch (error) {
    logger.error(`sSpawnHandler 에러 발생: ${error.message}`);
  }
};

const broadcastToSession = (session, payload, excludeUserId) => {
  session.users.forEach((targetUser) => {
    if (targetUser.id !== excludeUserId) {
      try {
        targetUser.socket.write(payload);
      } catch (error) {
        logger.error(`sSpawnHandler: S_Spawn 패킷 전송중 오류 발생 ${targetUser.id}: ${error.message}`);
      }
    }
  });
};
