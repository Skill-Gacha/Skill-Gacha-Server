import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const sPlayerActionHandler = async (user, dungeon, responseCode) => {
  const monster = dungeon.monsters.find((monster) => monster.monsterIdx === responseCode - 1);
  const damage = user.stat.atk;
  monster.monsterHp -= damage;

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

  let battleLog = {
    battleLog: {
      msg: `몬스터 ${monster.monsterName}에게 ${damage}만큼의 데미지를 줬습니다.`,
      typingAnimation: true,
    },
  };
  user.socket.write(createResponse(PacketType.S_BattleLog, battleLog));
  // TODO: 몬스터가 다 죽었는지 유무에 따라 던전 나갈 것인지, (진짜 향후 진행)혹은 더 깊게 들어갈 것인지 관련 코드 필요

  const alive = dungeon.monsters.filter((monster) => monster.monsterHp > 0);
  if (alive.length === 0) {
    removeDungeonSessionByUserId(user.id);
    const response = createResponse(PacketType.S_LeaveDungeon, {});
    user.socket.write(response);
    cEnterHandler({ socket, payload: { nickname: user.nickname, class: user.job } });
  }
};

export default sPlayerActionHandler;
