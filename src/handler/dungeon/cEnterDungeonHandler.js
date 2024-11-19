// src/handler/dungeon/cEnterDungeonHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '#managers/sessionManager.js';
import { v4 as uuidv4 } from 'uuid';
import Monster from '../../classes/models/monsterClass.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';
import { getGameAssets } from '../../init/loadAssets.js';
import { MyStatus } from '../../utils/battle/battle.js';

export const cEnterDungeonHandler = async ({ socket, payload }) => {
  const { dungeonCode } = payload;
  const user = sessionManager.getUserBySocket(socket);
  const monsterData = getGameAssets().MonsterData;

  if (!user) {
    console.error('cEnterDungeonHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  try {
    const dungeonId = uuidv4();
    const dungeon = sessionManager.createDungeon(dungeonId, dungeonCode);
    dungeon.addUser(user);

    const monsterCodes = monsterData.data.map((monster) => monster.monsterModel);
    const selectedMonsters = monsterData.data.filter((monster) =>
      monsterCodes.includes(monster.monsterModel),
    );

    // 던전 코드에 따라 몬스터를 선택
    const startIndex = dungeonCode * 5;
    const endIndex = startIndex + 5;
    const dungeonMonsters = selectedMonsters.slice(startIndex, endIndex);

    const totalMonsters = Math.floor(Math.random() * 3) + 1; // 1~3마리 랜덤 생성

    for (let i = 0; i < totalMonsters; i++) {
      const index = Math.floor(Math.random() * dungeonMonsters.length);
      const monsterData = dungeonMonsters[index];

      const monsterInstance = new Monster(
        dungeon.monsters.length,
        monsterData.monsterModel,
        monsterData.monsterName,
        monsterData.monsterHp,
        monsterData.monsterAtk,
        monsterData.monsterEffectCode,
      );

      dungeon.addMonster(monsterInstance);
    }

    // 타운 세션에서 사용자 제거 및 디스폰 처리
    await sDespawnHandler(user);

    // 던전 입장 패킷 생성 및 전송
    const enterDungeonPayload = createResponse(PacketType.S_EnterDungeon, {
      dungeonInfo: {
        dungeonCode,
        monsters: dungeon.monsters.map((monster) => ({
          monsterIdx: monster.monsterIdx,
          monsterModel: monster.monsterModel,
          monsterName: monster.monsterName,
          monsterHp: monster.monsterHp,
        })),
      },
      player: MyStatus(user),
      screenText: {
        msg: '던전에 입장했습니다!',
        typingAnimation: true,
      },
    });

    socket.write(enterDungeonPayload);

    console.log(`유저 ${user.id}가 던전 ${dungeonCode}에 입장하였습니다.`);
  } catch (error) {
    console.error('cEnterDungeonHandler 처리 중 오류 발생:', error);
  }
};
