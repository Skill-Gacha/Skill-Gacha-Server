// src/handlers/dungeon/states/GameOverWinState.js

import DungeonState from './DungeonState.js';
import sessionManager from '#managers/SessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';

export default class GameOverWinState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = 'GAME_OVER_WIN';

    // 승리 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '던전을 클리어 하였습니다!',
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
