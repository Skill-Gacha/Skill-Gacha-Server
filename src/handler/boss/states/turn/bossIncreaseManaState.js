// src/handler/boss/states/turn/bossIncreaseManaState.js

import { BOSS_STATUS } from '../../../../constants/battle.js';
import { PacketType } from '../../../../constants/header.js';
import { delay } from '../../../../utils/delay.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import BossActionState from '../action/bossActionState.js';
import BossRoomState from '../base/bossRoomState.js';
import BossTurnChangeState from './bossTurnChangeState.js';

const HP_RECOVERY_MIN = 5;
const HP_RECOVERY_MAX = 10;
const MP_RECOVERY_MIN = 5;
const MP_RECOVERY_MAX = 10;

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];

export default class BossIncreaseManaState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.INCREASE_MANA;

    if (this.user.turnOff === true) {
      this.user.completeTurn = true;
      this.updateUsersStatus([this.user]);
      await delay(2000);
      this.user.turnOff = false;
      this.changeState(BossTurnChangeState);
    } else {
      this.updateUsersStatus(this.users);
      await delay(2000);
      this.changeState(BossActionState);
    }
  }

  updateUsersStatus(users) {
    const aliveUsers = users.filter((user) => !user.isDead);

    aliveUsers.forEach((user) => {
      const existingHp = user.stat.hp;
      const existingMp = user.stat.mp;

      const randomHp = this.getRandomInt(HP_RECOVERY_MIN, HP_RECOVERY_MAX);
      const randomMp = this.getRandomInt(MP_RECOVERY_MIN, MP_RECOVERY_MAX);
      user.increaseHpMp(randomHp, randomMp);

      if (users.length === 1) {
        const battleLogMsg = `턴을 넘기셔서 체력이 ${user.stat.hp - existingHp}만큼 회복하였습니다. \n마나가 ${user.stat.mp - existingMp}만큼 회복하였습니다.`;
        const battleLogResponse = this.createBattleLogResponse(battleLogMsg);
        user.socket.write(battleLogResponse);
      }
    });

    if (users.length > 1) {
      const battleLogMsg = `모든 유저가 체력과 마나를 회복했습니다.`;
      const battleLogResponse = this.createBattleLogResponse(battleLogMsg);
      aliveUsers.forEach((user) => user.socket.write(battleLogResponse));
    }

    const statusResponse = this.createStatusResponse(users);

    this.users.forEach((user) => {
      user.socket.write(statusResponse);
    });
  }

  getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  createStatusResponse(users) {
    return createResponse(PacketType.S_BossPlayerStatusNotification, {
      playerId: users.map((user) => user.id),
      hp: users.map((user) => user.stat.hp),
      mp: users.map((user) => user.stat.mp),
    });
  }

  createBattleLogResponse(msg) {
    return createResponse(PacketType.S_BossBattleLog, {
      battleLog: {
        msg,
        typingAnimation: false,
        btns: BUTTON_OPTIONS.map((msg) => ({ msg, enable: false })),
      },
    });
  }

  async handleInput(responseCode) {}
}
