import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getAllUserExceptMyself } from '../../sessions/townSession.js';
import { playerData } from '../../utils/packet/playerPacket.js';

export const sSpawnHandler = async (newUser) => {
  const otherUsers = await getAllUserExceptMyself(newUser.id);

  // 새로운 사용자 정보 생성
  const newPlayerData = playerData(newUser);

  // S_Spawn 응답 생성
  const spawnResponse = createResponse(PacketType.S_Spawn, { players: [newPlayerData] });

  // 기존 사용자들에게 전송
  for (const user of otherUsers) {
    user.socket.write(spawnResponse);
  }
};
