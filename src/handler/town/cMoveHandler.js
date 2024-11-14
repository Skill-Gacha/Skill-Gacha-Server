import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getAllUserExceptMyself, getUserBySocket } from '../../sessions/townSession.js';

export const cMoveHandler = async ({ socket, payload }) => {
  // 클라이언트로부터 받은 TransformInfo 추출
  const { transform } = payload;

  // 소켓을 통해 사용자 정보 가져오기
  const user = await getUserBySocket(socket);
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
  const otherUsers = await getAllUserExceptMyself(user.id);
  for (const otherUser of otherUsers) {
    otherUser.socket.write(moveResponse);
  }
};
