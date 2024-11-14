import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getAllUserExceptMyself } from '../../sessions/townSession.js';

export const sSpawnHandler = async (newUser) => {
  const otherUsers = await getAllUserExceptMyself(newUser.id);

  // 새로운 사용자 정보 생성
  const newPlayerData = {
    playerId: newUser.id,
    nickname: newUser.nickname,
    class: newUser.job,
    transform: {
      posX: newUser.position.posX,
      posY: newUser.position.posY,
      posZ: newUser.position.posZ,
      rot: newUser.position.rot,
    },
    statInfo: {
      level: newUser.level,
      hp: newUser.stat.hp,
      maxHp: newUser.stat.maxHp,
      mp: newUser.stat.mp,
      maxMp: newUser.stat.maxMp,
      atk: newUser.stat.atk,
      def: newUser.stat.def,
      magic: newUser.stat.magic,
      speed: newUser.stat.speed,
    },
  };

  // S_Spawn 응답 생성
  const spawnResponse = createResponse(PacketType.S_Spawn, { players: [newPlayerData] });

  // 기존 사용자들에게 전송
  for (const user of otherUsers) {
    user.socket.write(spawnResponse);
  }
};
