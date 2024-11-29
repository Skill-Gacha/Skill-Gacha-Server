// src/handler/boss/states/bossGameOverWinState.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { BOSS_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';

export default class BossGameOverWinState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.GAME_OVER_WIN;

    // 승리 메시지 모든 유저에게 전송
    const winResponse = createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '축하드립니다 Null Dragon을 무찌르는데 성공하셨습니다.',
        typingAnimation: false,
      },
    });

    const bossUsers = this.bossRoom.getUsers();
    bossUsers.forEach((user) => {
      user.socket.write(winResponse);
    });

    sessionManager.removeBossRoom(this.bossRoom.sessionId);
  }

  async handleInput(responseCode) {
    if (responseCode === 0) {
      // ScreenText기 때문에 0을 받아야 함
      const sLeaveDungeonResponse = createResponse(PacketType.S_LeaveDungeon, {});
      this.socket.write(sLeaveDungeonResponse);
    } else {
      // responseCode 유효성 검사
      invalidResponseCode(this.socket);
    }
  }
}
