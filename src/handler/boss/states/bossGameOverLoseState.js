// src/handler/boss/states/bossGameOverLoseState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { BOSS_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import BossRoomState from './bossRoomState.js';

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

    this.users.forEach((user) => {
      user.socket.write(loseResponse);
    });
  }

  async handleInput(responseCode) {}
}
