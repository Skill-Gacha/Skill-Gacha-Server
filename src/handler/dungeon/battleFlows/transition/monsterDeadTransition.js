import { createResponse } from '../../../../utils/response/createResponse.js';
import { PacketType } from '../../../../constants/header.js';
import { STATE_OPPONENT_DEAD } from '../../../../constants/constants.js';

export default function monsterDeadTransition(dungeon, user) {
  const monster = dungeon.target;

  let hp, isDead;
  if (monster) {
    hp = monster.hp;
    isDead = monster.isDead;
  }

  if (hp <= 0 && isDead === false) {
    monster.isDead = true;

    //몬스터 죽는 모션 구현
    const actionSet = {
      animCode: 4,
      effectCode: 0,
    };
    const monsterAction = createResponse(PacketType.S_MonsterAction, {
      actionMonsterIdx: monster.monsterIdx,
      actionSet,
    });
    user.socket.write(monsterAction);

    const btns = [{ msg: '다음', enable: true }];
    const battleLog = {
      msg: `몬스터 ${monster.monsterName}이(가) 사망했습니다!`,
      typingAnimation: false,
      btns,
    };
    const responseBattleLog = createResponse(PacketType.S_BattleLog, { battleLog });
    user.socket.write(responseBattleLog);

    dungeon.target = null;
    dungeon.battleSceneStatus = STATE_OPPONENT_DEAD;
  } else {
    dungeon.target = null;
    monsterDeadTransition(dungeon, user);
  }
}
