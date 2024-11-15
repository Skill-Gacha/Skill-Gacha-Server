import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

const sPlayerAttackHandler = async (user, dungeon, responseCode) => {
  const monster = dungeon.monsters.find((monster) => monster.monsterIdx === responseCode - 1);

  monster.monsterHp -= user.stat.atk;

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

  user.socket.write(
    createResponse(PacketType.S_SetMonsterHp, {
      monsterIdx: monster.monsterIdx,
      hp: monster.monsterHp,
    }),
  );

  user.socket.write(
    createResponse(PacketType.S_BattleLog, {
      msg: `몬스터 ${monster.monsterName}에게 ${user.atk}만큼의 데미지를 줬습니다.`,
      typingAnimation: true,
    }),
  );

  // TODO: 몬스터가 다 죽었는지 유무에 따라 던전 나갈 것인지, (진짜 향후 진행)혹은 더 깊게 들어갈 것인지 관련 코드 필요

  //user.socket.write(PacketType.S_Spawn,{})
};

export default sPlayerAttackHandler;
