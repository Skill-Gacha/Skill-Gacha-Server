import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getUserBySocket } from '../../sessions/userSession.js';
import { dungeonSessions } from '../../sessions/sessions.js';
import { getGameAssets, getDungeonInfo } from '../../init/loadAssets.js';

export const sEnterDungeonHandler = async ({ socket, payload }) => {
  console.log('sEnterDungeonHandler 호출됨');
  const user = await getUserBySocket(socket);
  if (!user) {
    console.error('유저를 찾을 수 없습니다.');
    return;
  }

  const dungeonCode = payload.dungeonCode;
  console.log(`유저가 입장하려는 던전 코드: ${dungeonCode}`);

  const dungeonInfo = await getDungeonInfo(dungeonCode);
  console.log('가져온 던전 정보:', dungeonInfo);
  if (!dungeonInfo) {
    console.error('던전 정보를 가져오는 데 실패했습니다.');
    return;
  }
  user.enterDungeon(dungeonCode);
  console.log(`유저 ${user.nickname}가 ${dungeonCode} 던전에 입장함`);

  const data = {
    dungeonInfo: dungeonInfo,
    player: {
      playerClass: user.class,
      playerLevel: user.level,
      playerName: user.nickname,
      playerFullHp: user.statInfo.maxHp,
      playerFullMp: user.statInfo.maxMp,
      playerCurHp: user.statInfo.hp,
      playerCurMp: user.statInfo.mp,
    },
    screenText: payload.screenText || null,
    battleLog: user.battleLog || [],
  };

  const enterDungeonPayload = createResponse(PacketType.S_EnterDungeon, data);
  if (!dungeonSessions) {
    console.error('던전 세션을 찾을 수 없습니다.');
    return;
  }

  // 던전 내 모든 유저에게 패킷 전송
  console.log('던전 내 모든 유저에게 패킷 전송 중...'); // 패킷 전송 시작 알림
  dungeonSessions.forEach((targetSession) => {
    targetSession.users.forEach((targetUser) => {
      try {
        targetUser.socket.write(enterDungeonPayload);
        console.log(`패킷을 ${targetUser.nickname}에게 전송함`); // 패킷 전송 확인
      } catch (error) {
        console.error('S_EnterDungeon 패킷 전송중 오류 발생', error);
      }
    });
  });
};
