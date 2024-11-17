// src/handlers/cMoveHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '../../managers/SessionManager.js';

export const cMoveHandler = async ({ socket, payload }) => {
  // 클라이언트로부터 받은 TransformInfo 추출
  const { transform } = payload;

  // 소켓을 통해 사용자 정보 가져오기
  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('C_Move: 사용자 정보를 찾을 수 없습니다.');
    return;
  }

  // 사용자 위치 정보 업데이트
  user.position.posX = transform.posX;
  user.position.posY = transform.posY;
  user.position.posZ = transform.posZ;
  user.position.rot = transform.rot;

  // S_Move 메시지 생성
  const moveData = {
    playerId: user.id,
    transform: {
      posX: user.position.posX,
      posY: user.position.posY,
      posZ: user.position.posZ,
      rot: user.position.rot,
    },
  };

  const moveResponse = createResponse(PacketType.S_Move, moveData);

  // 다른 모든 사용자에게 S_Move 메시지 전송
  const session = sessionManager.getSessionByUserId(user.id);
  if (session) {
    session.users.forEach((targetUser) => {
      if (targetUser.id !== user.id) { // 자신을 제외하려면 조건 추가
        try {
          targetUser.socket.write(moveResponse);
        } catch (error) {
          console.error('S_Move 패킷 전송중 오류 발생', error);
        }
      }
    });
  } else {
    console.error('사용자가 속한 세션을 찾을 수 없습니다.');
  }
};
