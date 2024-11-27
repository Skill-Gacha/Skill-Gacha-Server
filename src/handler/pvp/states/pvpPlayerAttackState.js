// src/handler/pvp/states/pvpPlayerAttackState.js

import PvpState from './pvpState.js';
import PvpTurnChangeState from './pvpTurnChangeState.js';
import PvpEnemyDeadState from './pvpEnemyDeadState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import {
  checkStopperResist,
  skillEnhancement,
  updateDamage,
} from '../../../utils/battle/calculate.js';
import { BUFF_SKILL } from '../../../constants/battle.js';
import { buffSkill, pvpUseBuffSkill } from '../../../utils/battle/battle.js';
import { delay } from '../../../utils/delay.js';

// 플레이어가 공격하는 상태
export default class PvpPlayerAttackState extends PvpState {
  async enter() {
    const selectedSkill = this.pvpRoom.selectedSkill;
    const userSkillInfo = this.mover.userSkills[selectedSkill];

    if (userSkillInfo.id >= BUFF_SKILL) {
      // user.stat.buff 값 설정해주기
      buffSkill(this.mover, userSkillInfo.id);

      // 버프 상태에 따라 행동 결정
      pvpUseBuffSkill(this.mover, this.stopper);

      // 유저 MP 업데이트
      this.mover.reduceMp(userSkillInfo.mana);
      this.mover.socket.write(
        createResponse(PacketType.S_SetPvpPlayerMp, {
          mp: this.mover.stat.mp,
        }),
      );

      // 무버 액션 보내기
      this.sendActionAnimations(userSkillInfo.effectCode);
      await delay(1000);
      this.changeState(PvpTurnChangeState);
      return;
    }

    const damage = this.calculateDamage(userSkillInfo);
    let totalDamage = updateDamage(this.mover, damage);

    // 상대가 위험한 포션이나 영혼분쇄로 무적이 됐을 때
    if (this.stopper.stat.protect || this.stopper.stat.buff === 4) {
      totalDamage = 1;
      this.stopper.stat.protect = false;
      this.stopper.stat.buff = false;
    }

    this.applyDamage(totalDamage, userSkillInfo.mana);

    this.sendStatusUpdates();
    this.sendActionAnimations(userSkillInfo.effectCode);
    this.sendBattleLogs(totalDamage);

    if (this.stopper.stat.hp <= 0) {
      this.changeState(PvpEnemyDeadState);
    } else {
      this.changeState(PvpTurnChangeState);
    }
  }

  calculateDamage(skillInfo) {
    const playerElement = this.mover.element;
    const skillElement = skillInfo.element;
    const skillDamageRate = skillEnhancement(playerElement, skillElement);
    const userDamage = skillInfo.damage * skillDamageRate;
    const stopperResist = checkStopperResist(skillElement, this.stopper);
    return Math.floor(userDamage * ((100 - stopperResist) / 100));
  }

  applyDamage(damage, manaCost) {
    this.stopper.reduceHp(damage);
    this.mover.reduceMp(manaCost);
  }

  sendStatusUpdates() {
    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerMp, { mp: this.mover.stat.mp }),
    );
    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpEnemyHp, { hp: this.stopper.stat.hp }),
    );
    this.stopper.socket.write(
      createResponse(PacketType.S_SetPvpPlayerHp, { hp: this.stopper.stat.hp }),
    );
  }

  sendActionAnimations(effectCode) {
    const action = {
      actionSet: { animCode: 0, effectCode },
    };
    this.mover.socket.write(createResponse(PacketType.S_PvpPlayerAction, action));
    this.stopper.socket.write(createResponse(PacketType.S_PvpEnemyAction, action));
  }

  sendBattleLogs(damage) {
    const message = `${this.stopper.nickname}에게 ${damage}의 피해를 입혔습니다.`;
    const battleLog = {
      msg: message,
      typingAnimation: false,
      btns: [{ msg: this.stopper.nickname, enable: false }],
    };
    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));

    const stopperLog = {
      msg: `${this.mover.nickname}에게 ${damage}의 피해를 입었습니다.`,
      typingAnimation: false,
      btns: [{ msg: this.stopper.nickname, enable: false }],
    };
    this.stopper.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog: stopperLog }));
  }

  handleInput(responseCode) {
    // 입력 처리 없는 State
  }
}
