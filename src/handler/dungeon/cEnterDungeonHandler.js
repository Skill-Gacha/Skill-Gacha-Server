// src/handler/dungeon/cEnterDungeonHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getUserBySocket } from '../../sessions/userSession.js';
import { addDungeonSession } from '../../sessions/dungeonSession.js';
import Monster from '../../classes/models/MonsterClass.js';
import monsterData from '../../../assets/MonsterData.json' assert { type: 'json' };
import { v4 as uuid } from 'uuid';

export const cEnterDungeonHandler = async ({ socket, payload }) => {
  // 유저 정보 가져오기
  const { dungeonCode } = payload;
  const user = await getUserBySocket(socket);

  // 새로운 던전 세션 생성
  const dungeonId = uuid();
  const dungeon = addDungeonSession(dungeonId, dungeonCode);

  // 유저를 던전에 추가
  dungeon.addUser(user);


  if (dungeon.mode === 0) {   // PvE
    // 몬스터 수 결정 (1 ~ 3마리)
    // const numMonsters = Math.floor(Math.random() * 3) + 1;
    const numMonsters = 3;
    const buttons = [];

    for (let i = 0; i < numMonsters; i++) {
      const monsterInfos = monsterData.data;
      const index = Math.floor(Math.random() * monsterInfos.length);
      const monsterInfo = monsterInfos[index];

      // 몬스터 인스턴스 생성
      const monster = new Monster(
        i, // monsterIdx
        monsterInfos[i].monsterModel,
        monsterInfos[i].monsterName,
        monsterInfos[i].monsterHp,
        monsterInfos[i].monsterEffectCode,
        monsterInfos[i].monsterAtk,
      );

      // 던전에 몬스터 추가
      dungeon.addMonster(monster);

      // 버튼 정보에 몬스터 이름 추가
      buttons.push({ msg: monster.monsterName, enable: true });
    }

    // 응답 페이로드 구성
    const enterDungeonPayload = createResponse(PacketType.S_EnterDungeon, {
      dungeonInfo: {
        dungeonCode,
        monsters: dungeon.monsters.map((monster) => ({
          monsterIdx: monster.monsterIdx,
          monsterModel: monster.monsterModel,
          monsterName: monster.monsterName,
          monsterHp: monster.stat.hp,
        })),
      },
      player: {
        playerClass: user.job,
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
      },
      battleLog: {
        msg: '몬스터를 모두 처치하세요',
        typingAnimation: true,
        btns: buttons,
      },
    });

    // 유저에게 응답 전송
    user.socket.write(enterDungeonPayload);
  }
  else if (mode === 1) {   // PvP
    // PvP 로직 작성
    // 랭겜 대기 큐에서 상대 찾는 방식?
  }
};
