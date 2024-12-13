// src/handler/boss/states/result/bossGameOverWinState.js

import { BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import { sendBossScreenText } from '../../../../utils/battle/bossHelpers.js';

export default class BossGameOverWinState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.GAME_OVER_WIN;
    this.bossRoom.clearTurnTimer();

    sendBossScreenText(this.users, '축하합니다. Null Dragon을 무찌르는데 성공하셨습니다.');
  }

  async handleInput(responseCode) {}
}
