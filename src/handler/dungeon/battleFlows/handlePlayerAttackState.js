// src/handler/dungeon/battleFlows/handlePlayerAttackState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import switchToEnemyAttackState from '../transition/switchToEnemyAttackState.js';
import switchToMonsterDeadState from '../transition/switchToMonsterDeadState.js';

export default async function handlePlayerAttackState(responseCode, dungeon, user, socket) {
  const monster = dungeon.selectedMonster;

  const damage = user.stat.atk;
  monster.minusHp(damage);

  // 몬스터 HP 업데이트 패킷 전송
  socket.write(
    createResponse(PacketType.S_SetMonsterHp, {
      monsterIdx: monster.monsterIdx,
      hp: monster.monsterHp,
    }),
  );

  // 플레이어 공격 애니메이션 패킷 전송
  socket.write(
    createResponse(PacketType.S_PlayerAction, {
      targetMonsterIdx: monster.monsterIdx,
      actionSet: {
        animCode: 0, // 공격 애니메이션 코드
        effectCode: 3001, // 이펙트 코드
      },
    }),
  );

  // 공격 결과 메시지 전송
  socket.write(
    createResponse(PacketType.S_BattleLog, {
      battleLog: {
        msg: `${monster.monsterName}에게 ${damage}의 피해를 입혔습니다.`,
        typingAnimation: false,
        btns: [],
      },
    }),
  );

  if (monster.monsterHp <= 0) {
    await switchToMonsterDeadState(0, dungeon, user, socket);
  } else {
    await switchToEnemyAttackState(0, dungeon, user, socket);
  }
}
