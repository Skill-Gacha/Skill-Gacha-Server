import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getUserBySocket } from '../../sessions/userSession.js';
import { addDungeonSession } from '../../sessions/dungeonSession.js';
import MonsterClass from '../../../assets/MonsterData.json' with { type: 'json' };
import { v4 as uuid } from 'uuid';
import Monster from '../../classes/models/monsterClass.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';

export const cEnterDungeonHandler = async ({ socket, payload }) => {
  // 유저 정보 가져오기
  const { dungeonCode } = payload;
  const user = await getUserBySocket(socket);

  const btns = []; //버튼

  const dungeon = addDungeonSession(uuid(), dungeonCode);
  dungeon.addUserAtDungeon(user);

  const dungeonMonsters = MonsterClass.data;
  /*
  let monsterInfos;

  switch (dungeonCode - 1) {
    case 0:
      monsterInfos = dungeonMonsters.slice(0, 6); // 2002~2006 5
      break;
    case 1:
      monsterInfos = dungeonMonsters.slice(6, 16); // 2007~2015 6
      break;
    case 2:
      monsterInfos = dungeonMonsters.slice(16, 25); // 2016~2024 7
      break;
    case 3:
      monsterInfos = dungeonMonsters.slice(25, 30); // 2025~2029 4
      break;
    default:
      console.error(`던전 코드가 맞지 않음: ${dungeonCode}`);
      return;
  }
      */

  const monsterCodes = [...Array(28).keys()].map((i) => 2002 + i); // 2002부터 2029까지의 몬스터 코드 배열
  const monsterInfos = dungeonMonsters.filter((monster) =>
    monsterCodes.includes(monster.monsterModel),
  );

  // 던전 코드에 따라 몬스터 정보를 가져오기
  const startIndex = dungeonCode * 5;
  const endIndex = startIndex + 5;
  const selectedMonsters = monsterInfos.splice(startIndex, endIndex - startIndex);
  const monsterList = [];

  const totalMonsters = Math.max(1, Math.floor(Math.random() * 3)); //던전에 1~3마리

  for (let i = 0; i < totalMonsters; i++) {
    const index = Math.floor(Math.random() * selectedMonsters.length);
    const monster = selectedMonsters[index];

    const quantity = Math.floor(Math.random() * 3) + 1; //특정 몬스터 같은몬스터 1~3마리까지 가능
    for (let j = 0; j < quantity; j++) {
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
  }

  for (let i = 0; i < monsterList.length; i++) {
    delete monsterList[i].monsterAtk;
    delete monsterList[i].monsterEffectCode;
  }

  await sDespawnHandler(socket);

  // 데이터 구성
  // TODO : 던전에 입장 후 실제 데이터가 잘 전송 됐는지 확인하기
  const enterDungeonPayload = createResponse(PacketType.S_EnterDungeon, {
    dungeonInfo: {
      dungeonCode,
      monsters: monsterList,
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
};
