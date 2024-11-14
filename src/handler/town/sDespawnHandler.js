import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getUserBySocket } from '../../sessions/userSession.js';
import { townSession } from '../../sessions/sessions.js';

export const sDespawnHandler = async (socket) => {
  const user = await getUserBySocket(socket);
  if (!user) {
    console.error('유저를 찾을 수 없습니다.');
    return;
  }
  if (!townSession) {
    console.error('타운세션을 찾을 수 없습니다.');
    return;
  }
  // 해당 유저 마을세션에서 제거
  const userIndex = townSession.users.findIndex((targetUser) => targetUser === user);
  if (!userIndex) {
    console.error('마을에 해당 유저가 존재하지 않습니다.');
  }
  townSession.users.splice(userIndex, 1);
  const data = {
    playerIds: user.id,
  };
  const despawnPayload = createResponse(PacketType.S_Despawn, data);
  townSession.users.forEach((targetUser) => {
    if (targetUser !== user) {
      try {
        targetUser.socket.write(despawnPayload);
      } catch (error) {
        console.error('S_Despawn 패킷 전송 중 오류 발생', error);
      }
    }
  });
};
