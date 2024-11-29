// src/handler/town/cMoveHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const cMoveHandler = async ({ socket, payload }) => {
  try {
    const { transform } = payload;

    if (!validateTransform(transform)) {
      throw new Error('cMoveHandler: 유요하지 않은 Transform 데이터.');
    }

    const user = sessionManager.getUserBySocket(socket);
    if (!user) {
      throw new Error('cMoveHandler: 유저를 찾을 수 없습니다.');
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
    if (!session) {
      throw new Error('cMoveHandler: 유저가 속한 세션을 찾을 수 없습니다.');
    }

    broadcastToSession(session, moveResponse, user.id);
  } catch (error) {
    console.error(`cMoveHandler Error: ${error.message}`);
    // 필요한 경우 사용자에게 에러 응답 전송
  }
};

const validateTransform = (transform) => {
  // transform 데이터의 유효성 검사
  // x, y, z 좌표가 존재하는지 확인
  return transform && typeof transform === 'object';
};

const broadcastToSession = (session, payload, excludeUserId) => {
  session.users.forEach((targetUser) => {
    if (targetUser.id !== excludeUserId) {
      try {
        targetUser.socket.write(payload);
      } catch (error) {
        console.error(`cMoveHandler: S_Move 패킷 전송 중 오류 발생: ${targetUser.id}: ${error.message}`);
      }
    }
  });
};
