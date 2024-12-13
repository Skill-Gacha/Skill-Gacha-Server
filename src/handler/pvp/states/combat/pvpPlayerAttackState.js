// src/handler/pvp/states/combat/pvpPlayerAttackState.js

import PvpState from '../base/pvpState.js';
import PvpTurnChangeState from '../turn/pvpTurnChangeState.js';
import PvpEnemyDeadState from './pvpEnemyDeadState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import {
  checkStopperResist,
  skillEnhancement,
  updateDamage,
} from '../../../../utils/battle/calculate.js';
import { BUFF_SKILL, DEBUFF } from '../../../../constants/battle.js';
import { buffSkill } from '../../../../utils/battle/battle.js';
import { pvpUseBuffSkill } from '../../pvpUtils/pvpBuffs.js';

const ACTION_ANIMATION_CODE = 0;

export default class PvpPlayerAttackState extends PvpState {
  async enter() {
    const skillIndex = this.pvpRoom.selectedSkill;
    const userSkillInfo = this.mover.userSkills[skillIndex];

    if (userSkillInfo.id >= BUFF_SKILL || userSkillInfo.id === DEBUFF) {
      buffSkill(this.mover, userSkillInfo.id);

      this.mover.reduceMp(userSkillInfo.mana);

      pvpUseBuffSkill(this.mover, this.stopper);

      this.mover.socket.write(
        createResponse(PacketType.S_SetPvpPlayerMp, { mp: this.mover.stat.mp }),
      );

      this.sendActionAnimations(userSkillInfo.effectCode);
      this.changeState(PvpTurnChangeState);
      return;
    }

    const damage = this.calculateDamage(userSkillInfo);
    let totalDamage = updateDamage(this.mover, damage);

    if (this.stopper.stat.protect) {
      totalDamage = 1;
      this.stopper.stat.protect = false;
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
    const action = { actionSet: { animCode: ACTION_ANIMATION_CODE, effectCode } };
    this.mover.socket.write(createResponse(PacketType.S_PvpPlayerAction, action));
    this.stopper.socket.write(createResponse(PacketType.S_PvpEnemyAction, action));
  }

  sendBattleLogs(damage) {
    const battleLogForMover = {
      msg: `${this.stopper.nickname}에게 ${damage}의 피해를 입혔습니다.`,
      typingAnimation: false,
      btns: [{ msg: this.stopper.nickname, enable: false }],
    };
    this.mover.socket.write(
      createResponse(PacketType.S_PvpBattleLog, { battleLog: battleLogForMover }),
    );

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
