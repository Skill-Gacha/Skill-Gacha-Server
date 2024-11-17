// src/handler/dungeon/battleFlows/handleEnemyAttackState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import switchToGameOverLoseState from '../transition/switchToGameOverLoseState.js';
import { delay } from '../delay.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

export default async function handleEnemyAttackState(responseCode, dungeon, user, socket) {
  console.log('handleEnemyAttackState Called');
  const aliveMonsters = dungeon.monsters.filter((m) => m.monsterHp > 0);

  for (const monster of aliveMonsters) {
    const damage = monster.monsterAtk;
    user.updateUserHp(damage);

    // 플레이어 HP 업데이트 패킷 전송
    socket.write(
      createResponse(PacketType.S_SetPlayerHp, {
        hp: user.stat.hp,
      }),
    );

    // 몬스터 공격 애니메이션 패킷 전송
    socket.write(
      createResponse(PacketType.S_MonsterAction, {
        actionMonsterIdx: monster.monsterIdx,
        actionSet: {
          animCode: 0, // 공격 애니메이션 코드
          effectCode: monster.effectCode,
        },
      }),
    );

    // 공격 결과 메시지 전송
    socket.write(
      createResponse(PacketType.S_BattleLog, {
        battleLog: {
          msg: `${monster.monsterName}이(가) 당신을 공격하여 ${damage}의 피해를 입었습니다.`,
          typingAnimation: false,
          btns: [],
        },
      }),
    );

    // 플레이어 사망 체크
    if (user.stat.hp <= 0) {
      await switchToGameOverLoseState(dungeon, user, socket);
      return;
    }

    await delay(1000);
  }

  dungeon.dungeonStatus = DUNGEON_STATUS.ACTION;
}
