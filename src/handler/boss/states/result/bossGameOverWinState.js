// src/handler/boss/states/result/bossGameOverWinState.js

import { BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import { sendBossScreenText } from '../../../../utils/battle/bossHelpers.js';

export default class BossGameOverWinState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.GAME_OVER_WIN;
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

    sendBossScreenText(this.users, '축하합니다. Null Dragon을 무찌르는데 성공하셨습니다.');
  }

  async handleInput(responseCode) {
  }
}
