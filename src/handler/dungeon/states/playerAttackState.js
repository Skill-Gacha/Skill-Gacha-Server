// src/handler/dungeon/states/playerAttackState.js

import DungeonState from './dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import MonsterDeadState from './monsterDeadState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

// 플레이어가 공격하는 상태
export default class PlayerAttackState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.PLAYER_ATTACK;
    const targetMonster = this.dungeon.selectedMonster;
    const playerDamage = this.user.stat.atk;
    targetMonster.reduceHp(playerDamage);

    // 공격 시 의도되지 않은 조작 방지 위한 버튼 비활성화
    const disableButtons = this.dungeon.monsters.map((monster) => ({
      msg: monster.monsterName,
      enable: false,
    }));

    // 몬스터 HP 업데이트
    const setMonsterHpResponse = createResponse(PacketType.S_SetMonsterHp, {
      monsterIdx: targetMonster.monsterIdx,
      hp: targetMonster.monsterHp,
    });
    this.socket.write(setMonsterHpResponse);

    // 플레이어 공격 애니메이션 전송
    const playerActionResponse = createResponse(PacketType.S_PlayerAction, {
      targetMonsterIdx: targetMonster.monsterIdx,
      actionSet: {
        animCode: 0, // 공격 애니메이션 코드
        effectCode: 3001, // 이펙트 코드
      },
    });
    this.socket.write(playerActionResponse);

    // 공격 결과 메시지 전송
    const battleLogResponse = createResponse(PacketType.S_BattleLog, {
      battleLog: {
        msg: `${targetMonster.monsterName}에게 ${playerDamage}의 피해를 입혔습니다.`,
        typingAnimation: false,
        btns: disableButtons,
      },
    });
    this.socket.write(battleLogResponse);

    await delay(1000);

    // 몬스터 사망 여부 확인
    if (targetMonster.monsterHp <= 0) {
      this.changeState(MonsterDeadState);
    } else {
      this.changeState(EnemyAttackState);
    }
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
