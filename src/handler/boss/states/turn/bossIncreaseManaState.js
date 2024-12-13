// src/handler/boss/states/turn/bossIncreaseManaState.js

import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';
import { BOSS_STATUS, PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT } from '../../../../constants/battle.js';
import BossActionState from '../action/bossActionState.js';
import BossRoomState from '../base/bossRoomState.js';
import BossTurnChangeState from './bossTurnChangeState.js';
import { sendBossBattleLog, sendBossPlayerStatusOfUsers } from '../../../../utils/battle/bossHelpers.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';

const HP_RECOVERY_MIN = 5;
const HP_RECOVERY_MAX = 10;
const MP_RECOVERY_MIN = 5;
const MP_RECOVERY_MAX = 10;
const BUTTON_CONFIRM_ENABLE = [{ msg: '확인', enable: true }];
const BUTTON_CONFIRM_DISABLE = [{ msg: '확인', enable: false }];

export default class BossIncreaseManaState extends BossRoomState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null;
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
        sendBossBattleLog(
          user,
          battleLogMsg,
          this.user === user ? BUTTON_CONFIRM_ENABLE : BUTTON_CONFIRM_DISABLE,
        );
      }
    });

    if (users.length > 1 && aliveUsers.length > 0) {
      const battleLogMsg = `모든 유저가 체력과 마나를 회복했습니다.`;
      aliveUsers.forEach((user) => {
        sendBossBattleLog(
          user,
          battleLogMsg,
          this.user === user ? BUTTON_CONFIRM_ENABLE : BUTTON_CONFIRM_DISABLE,
        );
      });
    }

    sendBossPlayerStatusOfUsers(this.users, users);
  }

  getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  async handleInput(responseCode) {
    const aliveUsers = this.users.filter((user) => !user.isDead);
    if (responseCode === 1) {
      if (this.timeoutId) {
        this.timerMgr.cancelTimer(this.timeoutId);
        this.timeoutId = null;
      }

      if (this.user.turnOff === false && aliveUsers.length !== 0) {
        this.changeState(BossActionState);
      } else if (this.user.turnOff === true) {
        sendBossBattleLog(
          this.user,
          '다음차례로 넘어갑니다.',
          BUTTON_CONFIRM_DISABLE,
        );
        this.user.turnOff = false;
        this.changeState(BossTurnChangeState);
      }
    } else {
      invalidResponseCode(this.user.socket);
    }
  }
}