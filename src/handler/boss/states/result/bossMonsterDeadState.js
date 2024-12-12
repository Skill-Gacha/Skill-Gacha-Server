// src/handler/boss/states/result/bossMonsterDeadState.js

import { BOSS_GAME_OVER_CONFIRM_TIMEOUT_LIMIT, BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import BossGameOverWinState from './bossGameOverWinState.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';
import { sendBossBattleLog, sendBossMonsterAction } from '../../../../utils/battle/bossHelpers.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';

const DEATH_ANIMATION_CODE = 4;
const BOSS_INDEX = 0;
const RESPONSE_CODE = {
  SCREEN_TEXT_DONE: 1,
};
const BUTTON_CONFIRM = [{ msg: '귀환 대기 중', enable: false }];

export default class BossMonsterDeadState extends BossRoomState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null;
    this.timerMgr = serviceLocator.get(TimerManager);
  }

  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.MONSTER_DEAD;
    const boss = this.bossRoom.monsters[BOSS_INDEX];

    sendBossMonsterAction(this.users, boss.monsterIdx, DEATH_ANIMATION_CODE, null, []);

    sendBossBattleLog(this.users, `Null Dragon이 힘을 잃고 쓰러집니다.`, BUTTON_CONFIRM);

    this.timeoutId = this.timerMgr.requestTimer(BOSS_GAME_OVER_CONFIRM_TIMEOUT_LIMIT, () => {
      this.handleInput(RESPONSE_CODE.SCREEN_TEXT_DONE);
    });
  }

  async handleInput(responseCode) {
    if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE) {
      this.changeState(BossGameOverWinState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
