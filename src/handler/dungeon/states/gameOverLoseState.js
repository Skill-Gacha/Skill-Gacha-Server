﻿// src/handler/dungeon/states/gameOverLoseState.js

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

export default class GameOverLoseState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.GAME_OVER_LOSE;

    // 유저 버프 초기화
    user.buff = null;
    user.battleCry = false;
    user.berserk = false;
    user.dangerPotion = false;
    user.protect = false;
    user.downResist = false;

    // 아이템 현황 레디스에 저장
    await saveItemsToRedis(this.user.nickname, this.user.items);

    // 패배 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '당신은 사망하였습니다...',
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
