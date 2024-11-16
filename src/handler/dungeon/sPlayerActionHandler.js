import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

const sPlayerActionHandler = async (user, dungeon, responseCode) => {
  // let btns = [];

  // for (let monster of dungeon.monsters) {
  //   const isAlive = monster.monsterHp > 0 ? true : false;
  //   btns.push({ msg: monster.monsterName, enable: isAlive });
  //   //console.log('버튼 내 생존 여부', btns);
  // }

  // const response = createResponse(PacketType.S_BattleLog, {
  //   battleLog: {
  //     msg: '공격할 대상을 선택해주세요!',
  //     typingAnimation: true,
  //     btns,
  //   },
  // });

  //user.socket.write(response);

  const monster = dungeon.monsters.find((monster) => monster.monsterIdx === responseCode - 1);
  const damage = user.stat.atk;
  monster.monsterHp -= damage;

  if (monster.monsterHp <= 0) {
    user.socket.write(
      createResponse(PacketType.S_MonsterAction, {
        actionMonsterIdx: monster.monsterIdx,
        actionSet: {
          animCode: 4, // 0이랑 1이 몬스터 공격 모션
          effectCode: monster.effectCode,
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

  let battleLog = {
    battleLog: {
      msg: `몬스터 ${monster.monsterName}에게 ${damage}만큼의 데미지를 줬습니다.`,
      typingAnimation: true,
    },
  };
  user.socket.write(createResponse(PacketType.S_BattleLog, battleLog));
  // TODO: 몬스터가 다 죽었는지 유무에 따라 던전 나갈 것인지, (진짜 향후 진행)혹은 더 깊게 들어갈 것인지 관련 코드 필요
};

export default sPlayerActionHandler;
