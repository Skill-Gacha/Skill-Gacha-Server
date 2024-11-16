import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const sPlayerActionHandler = async (user, dungeon, responseCode) => {
  const monster = dungeon.monsters.find((monster) => monster.monsterIdx === responseCode - 1);
  const damage = user.stat.atk;
  monster.minusHp(damage);

  if (monster.monsterHp <= 0) {
    user.socket.write(
      createResponse(PacketType.S_MonsterAction, {
        actionMonsterIdx: monster.monsterIdx,
        actionSet: {
          animCode: 4, // 0이랑 1이 몬스터 공격 모션
        },
      }),
    );
  } else {
    user.socket.write(
      createResponse(PacketType.S_PlayerAction, {
        targetMonsterIdx: monster.monsterIdx,
        actionSet: {
          animCode: 0,
          // TODO: 현재 effectCode가 하드 코딩으로 고정된 상태 향후 스킬마다 이팩트 바꿔주기
          effectCode: 3001,
        },
      }),
    );
  }

  user.socket.write(
    createResponse(PacketType.S_SetMonsterHp, {
      monsterIdx: monster.monsterIdx,
      hp: monster.monsterHp,
    }),
  );

  let btns = [];

  for (let monster of dungeon.monsters) {
    btns.push({ msg: monster.monsterName, enable: false });
  }

  user.socket.write(
    createResponse(PacketType.S_BattleLog, {
      battleLog: {
        msg: `${monster.monsterName}에게 ${damage}만큼의 데미지를 줬습니다.`,
        typingAnimation: false,
        btns,
      },
    }),
  );

  const alive = dungeon.monsters.filter((monster) => monster.monsterHp > 0);
  if (alive.length === 0) {
    user.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '던전을 클리어 하셨습니다.',
          typingAnimation: true,
        },
      }),
    );
    //TODO : 2번 두 개 만들어주고, 하나의 버튼은 "더 깊게 들어가기", 하나는 "던전 나가기"
    return;
  }
};

export default sPlayerActionHandler;
