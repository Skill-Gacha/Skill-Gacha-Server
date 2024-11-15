import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getUserBySocket } from '../../sessions/userSession.js';
import { dungeonSessions } from '../../sessions/sessions.js';
import { addDungeonSession } from '../../sessions/dungeonSession.js';
import monsterData from '../../../assets/MonsterData.json' with { type: 'json' };
import { v4 as uuid } from 'uuid';

export const cEnterDungeonHandler = async ({ socket, payload }) => {
  // 유저 정보 가져오기
  const { dungeonCode } = payload;
  const user = await getUserBySocket(socket);

  const dungeon = addDungeonSession(uuid(), dungeonCode);

  dungeon.addUserAtDungeon(user);

  const num = Math.floor(Math.random() * 3) + 1;
  //  1 ~ 3
  const btn = [];

  console.log(`몬스터 데이터 ${monsterData}`);

  for (let i = 0; i < num; i++) {
    const monsterInfos = monsterData.data;
    const index = Math.floor(Math.random() * monsterInfos.length);
    dungeon.addMonster(monsterInfos[index], i);
    btn.push({ msg: monsterInfos.monsterName, enable: true });
  }

  // 데이터 구성
  // TODO : 던전에 입장 후 실제 데이터가 잘 전송 됐는지 확인하기
  const enterDungeonPayload = createResponse(PacketType.S_EnterDungeon, {
    dungeonInfo: {
      dungeonCode,
      monsters: dungeon.monsters,
    },
    player: {
      playerClass: user.stat.class,
      playerLevel: user.stat.level,
      playerName: user.nickname,
      playerFullHp: user.stat.maxHp,
      playerFullMp: user.stat.maxMp,
      playerCurHp: user.stat.hp,
      playerCurMp: user.stat.mp,
    },
    screenText: {
      msg: '던전에 입장했습니다!',
      typingAnimation: true,
      // alignment: {
      //   x: payload.screenText?.alignment?.x || 0,
      //   y: payload.screenText?.alignment?.y || 0,
      // },
      // textColor: payload.screenText?.textColor || null,
      // screenColor: payload.screenText?.screenColor || null,
    },
    battleLog: {
      msg: '몬스터를 모두 처치하세요',
      typingAnimation: true,
      btn,
    },
  });

  user.socket.write(enterDungeonPayload);
};
