// src/handler/dungeon/states/flee/fleeMessageState.js

import DungeonState from '../base/dungeonState.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';
import { sendLeaveDungeon, sendScreenText } from '../../../../utils/battle/dungeonHelpers.js';

const RESPONSE_CODE = { SCREEN_TEXT_DONE: 0 };

export default class FleeMessageState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.FLEE_MESSAGE;
    sendScreenText(this.socket, `전투에서 도망쳐 골드가 ${this.user.gold}원 남았습니다.`);
  }

  async handleInput(responseCode) {
    const sessionManager = serviceLocator.get(SessionManager);
    if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE) {
      sessionManager.removeDungeon(this.dungeon.sessionId);
      sendLeaveDungeon(this.socket);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
