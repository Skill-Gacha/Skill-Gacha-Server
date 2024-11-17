// src/handlers/cEnterDungeonHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '../../managers/SessionManager.js';
import MonsterClass from '../../../assets/MonsterData.json' assert { type: 'json' };
import { v4 as uuid } from 'uuid';
import Monster from '../../classes/models/monsterClass.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';

export const cEnterDungeonHandler = async ({ socket, payload }) => {
  const { dungeonCode } = payload;
  const user = sessionManager.getUserBySocket(socket);

  if (!user) {
    console.error('cEnterDungeonHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  try {
    const dungeonId = uuid();
    const dungeon = sessionManager.createDungeon(dungeonId, dungeonCode);
    dungeon.addUser(user);

    const monsterCodes = [...Array(28).keys()].map((i) => 2002 + i); // 2002부터 2029까지의 몬스터 코드 배열
    const monsterInfos = MonsterClass.data.filter((monster) =>
      monsterCodes.includes(monster.monsterModel),
    );

    // 던전 코드에 따라 몬스터 정보를 가져오기
    const startIndex = dungeonCode * 5;
    const endIndex = startIndex + 5;
    const selectedMonsters = monsterInfos.slice(startIndex, endIndex);
    const monsterList = [];

    const totalMonsters = Math.floor(Math.random() * 3) + 1; // 던전에 1~3마리

    const btns = []; // 버튼

    for (let i = 0; i < totalMonsters; i++) {
      const index = Math.floor(Math.random() * selectedMonsters.length);
      const monster = selectedMonsters[index];
      console.log(monster);

      const monsterInstance = new Monster(
        monsterList.length,
        monster.monsterModel,
        monster.monsterName,
        monster.monsterHp,
        monster.monsterAtk,
        monster.monsterEffectCode,
      );

      dungeon.addMonster(monsterInstance, monsterList.length);
      monsterList.push(monsterInstance);

      btns.push({ msg: monster.monsterName, enable: true });
    }

    const monsterListForSend = monsterList;
    // 몬스터 인스턴스에서 공격력과 이펙트 코드를 제거
    monsterListForSend.forEach((monster) => {
      delete monster.monsterAtk;
      delete monster.monsterEffectCode;
    });

    // 타운 세션에 있는 다른 사용자들에게 디스펜스 패킷 전송 (자신 포함)
    await sDespawnHandler(user);

    // 데이터 구성
    const enterDungeonPayload = createResponse(PacketType.S_EnterDungeon, {
      dungeonInfo: {
        dungeonCode,
        monsters: monsterListForSend,
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
        btns,
      },
    });

    user.socket.write(enterDungeonPayload);

    console.log(`유저 ${user.id}가 던전 ${dungeonCode}에 입장하였습니다.`);
  } catch (error) {
    console.error('cEnterDungeonHandler 처리 중 오류 발생:', error);
  }
};
