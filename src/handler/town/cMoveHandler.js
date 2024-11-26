// src/handler/town/cMoveHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const cMoveHandler = async ({ socket, payload }) => {
  const { transform } = payload;

  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('cMoveHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  // 사용자 위치 정보 업데이트
  user.position = { ...transform };

  // S_Move 메시지 생성
  const moveData = {
    playerId: user.id,
    transform: user.position,
  };

  const moveResponse = createResponse(PacketType.S_Move, moveData);

  // 다른 모든 사용자에게 S_Move 메시지 전송
  const session = sessionManager.getSessionByUserId(user.id);
  if (session) {
    session.users.forEach((targetUser) => {
      if (targetUser.id !== user.id) {
        try {
          targetUser.socket.write(moveResponse);
        } catch (error) {
          console.error('cMoveHandler: S_Move 패킷 전송 중 오류 발생:', error);
        }
      }
    });
  } else {
    console.error('cMoveHandler: 유저가 속한 세션을 찾을 수 없습니다.');
  }
};
