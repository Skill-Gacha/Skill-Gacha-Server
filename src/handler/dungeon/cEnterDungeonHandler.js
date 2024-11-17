// src/handler/dungeon/cEnterDungeonHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '#managers/SessionManager.js';
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

    for (let i = 0; i < totalMonsters; i++) {
      const index = Math.floor(Math.random() * selectedMonsters.length);
      const monster = selectedMonsters[index];

      const monsterInstance = new Monster(
        monsterList.length,
        monster.monsterModel,
        monster.monsterName,
        monster.monsterHp,
        monster.monsterAtk,
        monster.monsterEffectCode,
      );

      dungeon.addMonster(monsterInstance);
      monsterList.push(monsterInstance);
    }

    // 타운 세션에 있는 다른 사용자들에게 디스펜스 패킷 전송 (자신 포함)
    await sDespawnHandler(user);

    // 데이터 구성
    const enterDungeonPayload = createResponse(PacketType.S_EnterDungeon, {
      dungeonInfo: {
        dungeonCode,
        monsters: monsterList.map((monster) => ({
          monsterIdx: monster.monsterIdx,
          monsterModel: monster.monsterModel,
          monsterName: monster.monsterName,
          monsterHp: monster.monsterHp,
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
    });

    socket.write(enterDungeonPayload);

    // 던전 입장 메시지 전송
    // const enterDungeonMessage = createResponse(PacketType.S_ScreenText, {
    //   screenText: {
    //     msg: '던전에 입장했습니다!',
    //     typingAnimation: true,
    //     alignment: { x: 0, y: 0 },           // 기본값 설정
    //     textColor: { r: 255, g: 255, b: 255 }, // 기본값 설정
    //     screenColor: { r: 0, g: 0, b: 0 },     // 기본값 설정
    //   },
    // });
    // socket.write(enterDungeonMessage);

    // 행동 선택 메시지 전송
    // await switchToActionState(dungeon, socket);

    console.log(`유저 ${user.id}가 던전 ${dungeonCode}에 입장하였습니다.`);
  } catch (error) {
    console.error('cEnterDungeonHandler 처리 중 오류 발생:', error);
  }
};
