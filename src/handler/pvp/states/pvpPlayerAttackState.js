// src/handler/pvp/states/pvpPlayerAttackState.js

import PvpState from './pvpState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpMonsterDeadState from './pvpMonsterDeadState.js';
import PvpEnemyAttackState from './pvpEnemyAttackState.js';

// 플레이어가 공격하는 상태
export default class PlayerAttackState extends PvpState {
  async enter() {
    this.pvp.pvpStatus = PVP_STATUS.PLAYER_ATTACK;
    const targetMonster = this.pvp.selectedMonster;
    const playerDamage = this.user.stat.atk;
    targetMonster.reduceHp(playerDamage);

    // 공격 시 의도되지 않은 조작 방지 위한 버튼 비활성화 < 상대방이 때릴시 버튼 비활성화로 변경
    const disableButtons = this.pvp.monsters.map((monster) => ({
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

    // 몬스터 사망 여부 확인 < 사람으로 바꿔야함
    if (targetMonster.monsterHp <= 0) {
      this.changeState(PvpMonsterDeadState);
    } else {
      this.changeState(PvpEnemyAttackState);
    }
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
