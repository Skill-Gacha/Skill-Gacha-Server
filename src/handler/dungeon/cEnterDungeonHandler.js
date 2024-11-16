import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getUserBySocket } from '../../sessions/userSession.js';
import { addDungeonSession } from '../../sessions/dungeonSession.js';
import monsterData from '../../../assets/MonsterData.json' with { type: 'json' };
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

  const dungeonMonsters = {
    0: [2001, 2002, 2003, 2004, 2005, 2006, 2007],
    1: [2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015],
    2: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    3: [2025, 2026, 2027, 2028, 2029],
  };

  const monsterInfos = monsterData.data.filter((monster) =>
    dungeonMonsters[dungeonCode].includes(monster.monsterModel),
  );
  const monsterList = [];

  const totalMonsters = Math.floor(Math.random() * 3) + 1; //던전에 1~3마리

  for (let i = 0; i < totalMonsters; i++) {
    const index = Math.floor(Math.random() * monsterInfos.length);
    const monster = monsterInfos[index];
    const quantity = Math.floor(Math.random() * 3) + 1; //특정 몬스터 같은몬스터 1~3마리까지 가능

    for (let j = 0; j < quantity; j++) {
      const monsterInstance = new Monster(
        monsterList.length, // 몬스터 인덱스
        monster.monsterModel,
        monster.monsterName,
        monster.monsterHp,
        monster.monsterAtk,
        monster.monsterEffectCode,
      );

      dungeon.addMonster(monsterInstance, monsterList.length);
      monsterList.push(monsterInstance);

      // 각 몬스터 생성 시 버튼 추가
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
