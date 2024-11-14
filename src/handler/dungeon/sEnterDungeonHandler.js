import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getUserBySocket } from '../../sessions/userSession.js';
import { dungeonSessions } from '../../sessions/sessions.js';
import { getDungeonInfo } from '../../init/loadAssets.js';

export const sEnterDungeonHandler = async ({ socket, payload }) => {
  console.log('sEnterDungeonHandler 호출됨');

  // 유저 정보 가져오기
  const user = await getUserBySocket(socket);
  if (!user) {
    console.error('유저를 찾을 수 없습니다.');
    return;
  }

  const dungeonCode = payload.dungeonCode;
  console.log(`유저가 입장하려는 던전 코드: ${dungeonCode}`);

  // 던전 정보 가져오기
  const dungeonInfo = await getDungeonInfo(dungeonCode);
  if (!dungeonInfo) {
    console.error('던전 정보를 가져오는 데 실패했습니다.');
    return;
  }

  // 유저 던전 입장 처리
  user.enterDungeon(dungeonCode);
  console.log(`유저 ${user.nickname}가 ${dungeonCode} 던전에 입장함`);

  // 데이터 구성
  const enterDungeonPayload = createResponse(PacketType.S_EnterDungeon, {
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
    screenText: {
      msg: payload.screenText?.msg || '던전에 입장했습니다!', // 기본 메시지 설정
      typingAnimation: payload.screenText?.typingAnimation || false,
      alignment: {
        x: payload.screenText?.alignment?.x || 0,
        y: payload.screenText?.alignment?.y || 0,
      },
      textColor: payload.screenText?.textColor || null,
      screenColor: payload.screenText?.screenColor || null,
    },
    battleLog: user.battleLog || [], // 유저의 배틀 로그
  });

  // 던전 세션 존재 여부 확인
  if (!dungeonSessions || dungeonSessions.length === 0) {
    console.error('던전 세션을 찾을 수 없습니다.');
    return;
  }

  // 던전 내 모든 유저에게 패킷 전송
  dungeonSessions.forEach((targetSession) => {
    targetSession.users.forEach((targetUser) => {
      try {
        targetUser.socket.write(enterDungeonPayload);
        console.log(`패킷을 ${targetUser.nickname}에게 전송함`);
      } catch (error) {
        console.error('S_EnterDungeon 패킷 전송중 오류 발생', error);
      }
    });
  });
};
