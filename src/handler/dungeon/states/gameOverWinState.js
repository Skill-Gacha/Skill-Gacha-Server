// src/handler/dungeon/states/gameOverWinState.js

import DungeonState from './dungeonState.js';
import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { saveItemsToRedis } from '../../../db/redis/itemService.js';

const RESPONSE_CODE = {
  SCREEN_TEXT_DONE: 0,
};

export default class GameOverWinState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.GAME_OVER_WIN;

    // 유저 버프 초기화
    this.user.buff = null;
    this.user.battleCry = false;
    this.user.berserk = false;
    this.user.dangerPotion = false;
    this.user.protect = false;
    this.user.downResist = false;

    // 아이템 현황 레디스에 저장
    await saveItemsToRedis(this.user.nickname, this.user.items);

    // 승리 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '던전 클리어!',
          typingAnimation: false,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE) {
      this.endDungeonSession();
    } else {
      invalidResponseCode(this.socket);
    }
  }

  endDungeonSession() {
    sessionManager.removeDungeon(this.dungeon.sessionId);
    this.socket.write(createResponse(PacketType.S_LeaveDungeon, {}));
  }
}
