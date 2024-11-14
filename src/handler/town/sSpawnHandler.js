import { PacketType } from '../../constants/header.js';
import { townSession } from '../../sessions/sessions.js';
import { getUserBySocket } from '../../sessions/userSession.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const sSpawnHandler = async ({ socket, enterData }) => {
  const user = await getUserBySocket(socket);
  if (!user) {
    console.error('유저를 찾을 수 없습니다.');
    return;
  }

  townSession.users.forEach((targetUser) => {
    if (targetUser.id !== user.id) {
      try {
        const spawnData = createResponse(PacketType.S_Spawn, enterData);
        targetUser.socket.write(spawnData);
      } catch (error) {
        console.error('S_Animation 패킷 전송중 오류 발생', error);
      }
    }
  });
};
