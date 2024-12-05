// src/handler/boss/states/bossGameOverWinState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';

export default class BossGameOverWinState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.GAME_OVER_WIN;
    this.bossRoom.clearTurnTimer();

    // 유저 버프 초기화
    this.users.forEach((user) => {
      this.user.isDead = false;
      this.user.buff = null;
      this.user.battleCry = false;
      this.user.berserk = false;
      this.user.dangerPotion = false;
      this.user.protect = false;
      this.user.downResist = false;
    });

    // 승리 메시지 모든 유저에게 전송
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
