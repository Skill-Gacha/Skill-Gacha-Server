// src/handler/boss/states/bossIncreaseManaState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import { PacketType } from '../../../constants/header.js';
import { delay } from '../../../utils/delay.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossRoomState from './bossRoomState.js';
import BossTurnChangeState from './bossTurnChangeState.js';

const HP_RECOVERY_MIN = 5;
const HP_RECOVERY_MAX = 10;
const MP_RECOVERY_MIN = 5;
const MP_RECOVERY_MAX = 10;

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];

export default class BossIncreaseManaState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.INCREASE_MANA;

    // 턴 넘기기를 사용했을 때
    if (this.user.turnOff === true) {
      this.handleRecovery([this.user]);
      this.user.turnOff = false;
    }

    // 보스의 공격이 진행된 후
    else {
      this.handleRecovery(this.users);
    }

    await delay(5000); // 시간제한이 없어서 임시로 설정
    this.changeState(BossTurnChangeState);

    // 5초 후에 handleInput(1)을 자동으로 호출하는 타이머 설정
    // this.timeoutId = setTimeout(() => {
    //   this.handleInput(1);
    // }, PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT); // ms
  }

  handleRecovery(users) {
    const statusResponse = this.createStatusResponse(users);

    users.forEach((user) => {
      // 상태 알림 생성 및 전송
      user.socket.write(statusResponse);
      const existingHp = user.stat.hp;
      const existingMp = user.stat.mp;

      // HP와 MP 회복
      const randomHp = this.getRandomInt(HP_RECOVERY_MIN, HP_RECOVERY_MAX);
      const randomMp = this.getRandomInt(MP_RECOVERY_MIN, MP_RECOVERY_MAX);
      user.increaseHpMp(randomHp, randomMp);

      // 배틀 로그 생성 및 전송
      const battleLogMsg = `턴을 넘기셔서 체력이 ${user.stat.hp - existingHp}만큼 회복하였습니다. \n마나가 ${user.stat.mp - existingMp}만큼 회복하였습니다.`;

      // 턴을 넘긴 경우, 해당 유저만 배틀 로그
      if (users.length === 1) {
        const battleLogResponse = this.createBattleLogResponse(battleLogMsg);
        user.socket.write(battleLogResponse);
      }
    });

    // 보스 공격 후 회복 상태라면, 모든 유저에게 배틀 로그
    if (users.length > 1) {
      const battleLogMsg = `모든 유저가 체력과 마나를 회복했습니다.`;
      const battleLogResponse = this.createBattleLogResponse(battleLogMsg);
      users.forEach((user) => user.socket.write(battleLogResponse));
    }
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
