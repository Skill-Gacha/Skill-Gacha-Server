// src/handler/boss/states/result/bossGameOverWinState.js

import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';

export default class BossGameOverWinState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.GAME_OVER_WIN;
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

    const winResponse = createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '축하드립니다 Null Dragon을 무찌르는데 성공하셨습니다.',
        typingAnimation: false,
      },
    });

    this.users.forEach((user) => {
      user.socket.write(winResponse);
    });
  }

  async handleInput(responseCode) {}
}
