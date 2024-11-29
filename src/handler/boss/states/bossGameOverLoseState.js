// src/handler/boss/states/bossGameOverLoseState.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { BOSS_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';

export default class BossGameOverLoseState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.GAME_OVER_LOSE;

    // 패배 메시지 모든 유저에게 전송
    const loseResponse = createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '모든 유저가 사망하여 마을로 복귀힙니다...',
        typingAnimation: false,
      },
    });

    const bossUsers = this.bossRoom.getUsers();
    bossUsers.forEach((user) => {
      user.socket.write(loseResponse);
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
