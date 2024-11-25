// src/handler/pvp/states/pvpPlayerAttackState.js

import PvpState from './pvpState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import { skillEnhancement, checkStopperResist } from '../../../utils/battle/calculate.js';
import PvpEnemyDeadState from './pvpEnemyDeadState.js';
import PvpTurnChangeState from './pvpTurnChangeState.js';

// 플레이어가 공격하는 상태
export default class PvpPlayerAttackState extends PvpState {
  async enter() {
    this.pvpRoom.pvpState = PVP_STATUS.PLAYER_ATTACK;

    const selectedSkill = this.pvpRoom.selectedSkill;
    const userSkillInfo = this.mover.userSkills[selectedSkill];

    // 플레이어의 속성과 스킬의 속성이 일치하는지 검증 후, 배율 적용(1차 검증)
    const playerElement = this.mover.element;
    const skillElement = userSkillInfo.element;
    const skillDamageRate = skillEnhancement(playerElement, skillElement);
    const userDamage = userSkillInfo.damage * skillDamageRate;

    // 2차 검증 첫번째 : 상대가 저항값을 가지고 있냐?
    const stopperResist = checkStopperResist(skillElement, this.stopper);

    // 저항값이 적용된 최종 대미지
    const totalDamage = Math.floor(userDamage * ((100 - stopperResist) / 100));

    this.stopper.reduceHp(totalDamage);
    this.mover.reduceMp(userSkillInfo.mana);

    // 공격 유저 MP 업데이트
    const setPlayerMpResponse = createResponse(PacketType.S_SetPvpPlayerMp, {
      mp: this.mover.stat.mp,
    });
    this.mover.socket.write(setPlayerMpResponse);

    // 상대방 HP 업데이트
    const setEnemyHpResponse = createResponse(PacketType.S_SetPvpEnemyHp, {
      hp: this.stopper.stat.hp,
    });
    this.mover.socket.write(setEnemyHpResponse);

    // 맞는 유저 HP 업데이트
    const setStopperHpResponse = createResponse(PacketType.S_SetPvpPlayerHp, {
      hp: this.stopper.stat.hp,
    });
    this.stopper.socket.write(setStopperHpResponse);

    // 공격 시 의도되지 않은 조작 방지 위한 버튼 비활성화
    const disableButtons = [{ msg: this.stopper.nickname, enable: false }];

    // 공격 유저 애니메이션
    const playerActionResponse = createResponse(PacketType.S_PvpPlayerAction, {
      actionSet: {
        animCode: 0, // 공격 애니메이션 코드
        effectCode: userSkillInfo.effectCode, // 이펙트 코드
      },
    });
    this.mover.socket.write(playerActionResponse);

    // 맞는 유저 애니메이션
    const enemyActionResponse = createResponse(PacketType.S_PvpEnemyAction, {
      actionSet: {
        animCode: 0, // 공격 애니메이션 코드
        effectCode: userSkillInfo.effectCode, // 이펙트 코드
      },
    });
    this.stopper.socket.write(enemyActionResponse);

    // 공격 결과 메시지 전송(때리는 놈)
    if (skillDamageRate > 1) {
      const moverBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
        battleLog: {
          msg: `효과는 굉장했다! \n${this.stopper.nickname}에게 ${totalDamage}의 피해를 입혔습니다.`,
          typingAnimation: false,
          btns: disableButtons,
        },
      });
      this.mover.socket.write(moverBattleLogResponse);
    } else {
      const moverBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
        battleLog: {
          msg: `${this.stopper.nickname}에게 ${totalDamage}의 피해를 입혔습니다.`,
          typingAnimation: false,
          btns: disableButtons,
        },
      });
      this.mover.socket.write(moverBattleLogResponse);
    }

    // 공격 결과 메시지 전송(맞는 놈)
    let stopperBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
      battleLog: {
        msg: `${this.mover.nickname}에게 ${totalDamage}의 피해를 입었습니다.`,
        typingAnimation: false,
        btns: disableButtons,
      },
    });
    this.stopper.socket.write(stopperBattleLogResponse);

    // 맞는 유저 사망 여부 확인
    if (this.stopper.stat.hp <= 0) {
      this.changeState(PvpEnemyDeadState);
    }
    // 죽지 않았으면 턴 교체
    else {
      this.changeState(PvpTurnChangeState);
    }
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
