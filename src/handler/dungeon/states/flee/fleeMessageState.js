// src/handler/dungeon/states/fleeMessageState.js

import DungeonState from '../base/dungeonState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';

const RESPONSE_CODE = {
  SCREEN_TEXT_DONE: 0,
};

export default class FleeMessageState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.FLEE_MESSAGE;

    // 도망 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: `전투에서 도망쳐 골드가 ${this.user.gold}원 남았습니다.`,
          typingAnimation: false,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    const sessionManager = serviceLocator.get(SessionManager);
    if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE) {
      // 던전 종료 및 세션 제거
      sessionManager.removeDungeon(this.dungeon.sessionId);
      this.socket.write(createResponse(PacketType.S_LeaveDungeon, {}));
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
