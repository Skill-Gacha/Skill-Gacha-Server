﻿// src/handler/pvp/states/pvpPlayerAttackState.js

import PvpState from './pvpState.js';
import PvpTurnChangeState from './pvpTurnChangeState.js';
import PvpEnemyDeadState from './pvpEnemyDeadState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import { skillEnhancement, checkStopperResist } from '../../../utils/battle/calculate.js';
import PvpEnemyDeadState from './pvpEnemyDeadState.js';
import PvpTurnChangeState from './pvpTurnChangeState.js';

// 플레이어가 공격하는 상태
export default class PvpPlayerAttackState extends PvpState {
  async enter() {
    const selectedSkill = this.pvpRoom.selectedSkill;
    const userSkillInfo = this.mover.userSkills[selectedSkill];

    const totalDamage = this.calculateDamage(userSkillInfo);
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

    console.log(playerElement);
    console.log(skillElement);
    console.log(skillDamageRate);
    console.log(userDamage);
    console.log(stopperResist);
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
