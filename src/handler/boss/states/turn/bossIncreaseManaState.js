// src/handler/boss/states/turn/bossIncreaseManaState.js

import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';
import { BOSS_STATUS, PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT } from '../../../../constants/battle.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import BossActionState from '../action/bossActionState.js';
import BossRoomState from '../base/bossRoomState.js';
import BossTurnChangeState from './bossTurnChangeState.js';

const HP_RECOVERY_MIN = 5;
const HP_RECOVERY_MAX = 10;
const MP_RECOVERY_MIN = 5;
const MP_RECOVERY_MAX = 10;
const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class BossIncreaseManaState extends BossRoomState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null; // 타이머 식별자 초기화
    this.timerMgr = serviceLocator.get(TimerManager);
  }

  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.INCREASE_MANA;

    if (this.user.turnOff === true) {
      this.user.completeTurn = true;
      this.updateUsersStatus([this.user]);
    } else {
      this.updateUsersStatus(this.users);
    }

    // 타이머 매니저를 통해 타이머 설정
    this.timeoutId = this.timerMgr.requestTimer(PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT, () => {
      this.handleInput(1);
    });
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
        const battleLogResponse = this.createBattleLogResponse(battleLogMsg, user);
        user.socket.write(battleLogResponse);
      }
    });

    if (users.length > 1) {
      const battleLogMsg = `모든 유저가 체력과 마나를 회복했습니다.`;
      aliveUsers.forEach((user) => {
        const battleLogResponse = this.createBattleLogResponse(battleLogMsg, user);
        user.socket.write(battleLogResponse);
      });
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

  createBattleLogResponse(msg, user) {
    return createResponse(PacketType.S_BossBattleLog, {
      battleLog: {
        msg,
        typingAnimation: false,
        btns: this.user === user ? BUTTON_CONFIRM : [],
      },
    });
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      if (this.timeoutId) {
        this.timerMgr.cancelTimer(this.timeoutId); // 타이머 취소
        this.timeoutId = null;
      }

      if (this.user.turnOff === false) {
        this.changeState(BossActionState);
      } else if (this.user.turnOff === true) {
        this.user.socket.write(
          createResponse(PacketType.S_BossBattleLog, {
            battleLog: {
              msg: '다음차례로 넘어갑니다.',
              typingAnimation: false,
              btns: [{ msg: '확인', enable: false }],
            },
          }),
        );
        this.user.turnOff = false;
        this.changeState(BossTurnChangeState);
      }
    } else {
      invalidResponseCode(this.user.socket);
    }
  }
}
