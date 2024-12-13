// src/handler/dungeon/states/result/gameOverLoseState.js

import DungeonState from '../base/dungeonState.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { saveItemsToRedis } from '../../../../db/redis/itemService.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';
import { sendLeaveDungeon, sendScreenText } from '../../../../utils/battle/dungeonHelpers.js';

const RESPONSE_CODE = { SCREEN_TEXT_DONE: 0 };

export default class GameOverLoseState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.GAME_OVER_LOSE;
    await saveItemsToRedis(this.user.nickname, this.user.inventory.items);
    sendScreenText(this.socket, '당신은 사망하였습니다...');
  }

  async handleInput(responseCode) {
    if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE) {
      this.endDungeonSession();
    } else {
      invalidResponseCode(this.socket);
    }
  }

  endDungeonSession() {
    const sessionManager = serviceLocator.get(SessionManager);
    sessionManager.removeDungeon(this.dungeon.sessionId);
    sendLeaveDungeon(this.socket);
  }
}
