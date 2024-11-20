// src/handler/dungeon/states/gameOverLoseState.js

import DungeonState from './dungeonState.js';
import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';

export default class GameOverLoseState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.GAME_OVER_LOSE;

    // 패배 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '당신은 사망하였습니다...',
          typingAnimation: true,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === 0) {
      // ScreenText기 때문에 0을 받아야 함
      // 던전 종료 및 세션 제거
      sessionManager.removeDungeon(this.dungeon.sessionId);
      const sLeaveDungeonResponse = createResponse(PacketType.S_LeaveDungeon, {});
      this.socket.write(sLeaveDungeonResponse);
    } else {
      // responseCode 유효성 검사
      invalidResponseCode(this.socket);
    }
  }
}
