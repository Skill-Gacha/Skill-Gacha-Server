// src/handler/dungeon/battleFlows/handleMonsterDeadState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import switchToGameOverWinState from '../transition/switchToGameOverWinState.js';
import switchToEnemyAttackState from '../transition/switchToEnemyAttackState.js';

export default async function handleMonsterDeadState(responseCode, dungeon, user, socket) {
  // 몬스터 사망 애니메이션 전송
  socket.write(
    createResponse(PacketType.S_MonsterAction, {
      actionMonsterIdx: dungeon.selectedMonster.monsterIdx,
      actionSet: {
        animCode: 4, // 사망 애니메이션 코드
      },
    }),
  );

  const aliveMonsters = dungeon.monsters.filter((m) => m.monsterHp > 0);

  if (aliveMonsters.length === 0) {
    await switchToGameOverWinState(responseCode, dungeon, user, socket);
  } else {
    await switchToEnemyAttackState(responseCode, dungeon, user, socket);
  }
}
