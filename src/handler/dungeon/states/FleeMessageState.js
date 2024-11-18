// src/handlers/dungeon/states/FleeMessageState.js

import DungeonState from './DungeonState.js';
import sessionManager from '#managers/SessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';

export default class FleeMessageState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = 'FLEE_MESSAGE';

    // 도망 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '전투에서 도망쳤습니다.',
          typingAnimation: true,
          btns: [{ msg: '확인', enable: true }],
        },
      }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === 0) {
      // 던전 종료 및 세션 제거
      sessionManager.removeDungeon(this.dungeon.sessionId);
      this.socket.write(createResponse(PacketType.S_LeaveDungeon, {}));
    } else {
      // 잘못된 입력 처리
    }
  }
}
