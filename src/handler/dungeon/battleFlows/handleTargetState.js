// src/handler/dungeon/battleFlows/handleTargetState.js

import switchToPlayerAttackState from '../transition/switchToPlayerAttackState.js';

export default async function handleTargetState(responseCode, dungeon, user, socket) {
  console.log('handleTargetState Called');
  const monster = dungeon.monsters.find((m) => m.monsterIdx === responseCode - 1);
  if (monster && monster.monsterHp > 0) {
    dungeon.selectedMonster = monster;
    await switchToPlayerAttackState(dungeon, user, socket);
  } else {
    // 유효하지 않은 몬스터 선택 처리
    // 에러 메시지 전송 등
  }
}
