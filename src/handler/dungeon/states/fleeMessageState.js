// src/handler/dungeon/states/fleeMessageState.js

import DungeonState from './dungeonState.js';
import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';

export default class FleeMessageState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.FLEE_MESSAGE;

    // 도망 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '전투에서 도망쳤습니다.',
          typingAnimation: true,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === 0) {
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
