// src/handler/boss/states/combat/bossPlayerDeadState.js

import {
  BOSS_STATUS,
  BOSS_TURN_OVER_CONFIRM_TIMEOUT_LIMIT,
} from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import BossGameOverLoseState from '../result/bossGameOverLoseState.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';
import BossIncreaseManaState from '../turn/bossIncreaseManaState.js';
import { sendBossBattleLog } from '../../../../utils/battle/bossHelpers.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';

const BOSS_USER_COUNT = 3;
const RESPONSE_CODE = {
  SCREEN_TEXT_DONE: 1,
};
const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class BossPlayerDeadState extends BossRoomState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null;
    this.timerMgr = serviceLocator.get(TimerManager);
  }

  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.PLAYER_DEAD;

    const deadUsers = this.users.filter((u) => u.stat.hp <= 0);

    deadUsers.forEach((user) => {
      sendBossBattleLog(user, `체력이 0이 되어 사망하였습니다. \n팀원들을 믿고 기다리세요`, [{msg:'화이팅',enable:false}]);
      user.isDead = true;
    });

    if (deadUsers.length === BOSS_USER_COUNT) {
      this.bossRoom.clearTurnTimer();
      deadUsers.forEach((user) => {
        sendBossBattleLog(user, `모든 유저가 사망하였습니다.`, BUTTON_CONFIRM);
      });

      this.timeoutId = this.timerMgr.requestTimer(BOSS_TURN_OVER_CONFIRM_TIMEOUT_LIMIT, () => {
        this.handleInput(1);
      });
    }
  }

  async handleInput(responseCode) {
    const deadUsers = this.users.filter((u) => u.stat.hp <= 0);
    if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE && deadUsers.length === BOSS_USER_COUNT) {
      this.changeState(BossGameOverLoseState);
    } else if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE) {
      this.changeState(BossIncreaseManaState);
    } else {
      invalidResponseCode(this.user.socket);
    }
  }
}
