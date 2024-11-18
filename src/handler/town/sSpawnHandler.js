// src/handler/town/sSpawnHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '#managers/sessionManager.js';
import { playerData } from '../../utils/packet/playerPacket.js';

export const sSpawnHandler = async (newUser) => {
  const session = sessionManager.getSessionByUserId(newUser.id);
  if (!session) {
    console.error('sSpawnHandler: 사용자가 속한 세션을 찾을 수 없습니다.');
    return;
  }

  // 새로운 사용자 정보 생성
  const newPlayerData = playerData(newUser);

  // S_Spawn 응답 생성
  const spawnResponse = createResponse(PacketType.S_Spawn, { players: [newPlayerData] });

  // 기존 사용자들에게 전송 (자신을 제외)
  session.users.forEach((targetUser) => {
    if (targetUser.id !== newUser.id) {
      try {
        targetUser.socket.write(spawnResponse);
      } catch (error) {
        console.error('S_Spawn 패킷 전송중 오류 발생', error);
      }
    }
  });
};
