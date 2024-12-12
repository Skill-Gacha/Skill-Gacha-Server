// src/handler/boss/states/result/bossGameOverLoseState.js

import { BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import { sendBossScreenText } from '../../../../utils/battle/bossHelpers.js';

export default class BossGameOverLoseState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.GAME_OVER_LOSE;
    this.bossRoom.clearTurnTimer();

    this.users.forEach((user) => {
      user.isDead = false;
      user.buff = null;
      user.battleCry = false;
      user.stimPack = false;
      user.dangerPotion = false;
      user.protect = false;
      user.downResist = false;
      user.completeTurn = false;
    });

    sendBossScreenText(this.users, '모든 유저가 사망하여 마을로 복귀합니다...');
  }

  async handleInput(responseCode) {
  }
}
