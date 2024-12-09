// src/handler/boss/states/result/bossGameOverLoseState.js

import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';

export default class BossGameOverLoseState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.GAME_OVER_LOSE;
    this.bossRoom.clearTurnTimer();

    this.users.forEach((user) => {
      user.isDead = false;
      user.buff = null;
      user.battleCry = false;
      user.berserk = false;
      user.dangerPotion = false;
      user.protect = false;
      user.downResist = false;
      user.completeTurn = false;
    });

    const loseResponse = createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '모든 유저가 사망하여 마을로 복귀힙니다...',
        typingAnimation: false,
      },
    });

    this.users.forEach((user) => {
      user.socket.write(loseResponse);
    });
  }

  async handleInput(responseCode) {
  }
}
