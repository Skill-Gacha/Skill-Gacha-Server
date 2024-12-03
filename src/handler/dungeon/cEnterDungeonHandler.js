// src/handler/dungeon/cEnterDungeonHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '#managers/sessionManager.js';
import { v4 as uuidv4 } from 'uuid';
import Monster from '../../classes/models/monsterClass.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';
import { getGameAssets } from '../../init/loadAssets.js';
import { MyStatus } from '../../utils/battle/battle.js';
import { DUNGEON_CODE } from '../../constants/battle.js';
import { elementResist } from '../../utils/packet/playerPacket.js';
import { handleError } from '../../utils/error/errorHandler.js';
import logger from '../../utils/log/logger.js';

const MONSTERS_PER_DUNGEON_DELIMITER = 7;
const MIN_MONSTERS = 1;
const MAX_MONSTERS = 3;

export const cEnterDungeonHandler = async ({ socket, payload }) => {
  const { dungeonCode } = payload;
  const user = sessionManager.getUserBySocket(socket);

  if (!user) {
    logger.error('cEnterDungeonHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  try {
    const dungeonId = uuidv4();
    const dungeon = sessionManager.createDungeon(dungeonId, dungeonCode);
    dungeon.addUser(user);

    // 타운 세션에서 사용자 제거 및 디스폰 처리
    await sDespawnHandler(user);

    // 몬스터 데이터 로드
    const monsterData = getGameAssets().MonsterData.data;
    const dungeonMonsters = selectDungeonMonsters(dungeonCode, monsterData);
    const monsters = generateRandomMonsters(dungeonMonsters);

    monsters.forEach((monster) => dungeon.addMonster(monster));

    const actualDungeonCode = dungeonCode + DUNGEON_CODE;

    // 던전 입장 패킷 생성 및 전송
    const enterDungeonPayload = createResponse(PacketType.S_EnterDungeon, {
      dungeonInfo: {
        dungeonCode: actualDungeonCode,
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
        typingAnimation: false,
      },
    });

    socket.write(enterDungeonPayload);

    logger.info(`유저 ${user.id}가 던전 ${actualDungeonCode}에 입장하였습니다.`);
  } catch (error) {
    logger.error('cEnterDungeonHandler 처리 중 오류 발생:', error);
    handleError(error);
  }
};

const selectDungeonMonsters = (dungeonCode, monsterData) => {
  const startIndex = (dungeonCode - 1) * MONSTERS_PER_DUNGEON_DELIMITER;
  const endIndex = startIndex + MONSTERS_PER_DUNGEON_DELIMITER;
  return monsterData.slice(startIndex, endIndex);
};

const generateRandomMonsters = (dungeonMonsters) => {
  const totalMonsters =
    Math.floor(Math.random() * (MAX_MONSTERS - MIN_MONSTERS + 1)) + MIN_MONSTERS;

  const monsters = [];
  for (let i = 0; i < totalMonsters; i++) {
    const index = Math.floor(Math.random() * dungeonMonsters.length);
    const findMonster = dungeonMonsters[index];
    const monsterResists = elementResist(findMonster);

    const monsterInstance = new Monster(
      i,
      findMonster.monsterModel,
      findMonster.monsterName,
      findMonster.monsterHp,
      findMonster.monsterAtk,
      findMonster.monsterEffectCode,
      monsterResists,
    );

    monsters.push(monsterInstance);
  }
  return monsters;
};
