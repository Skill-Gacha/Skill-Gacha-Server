// src/handler/dungeon/states/message/messageState.js

import DungeonState from '../base/dungeonState.js';
import ActionState from '../action/actionState.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { sendScreenDone } from '../../../../utils/battle/dungeonHelpers.js';

const RESPONSE_CODE = { SCREEN_TEXT_DONE: 0 };

export default class MessageState extends DungeonState {
  constructor(dungeon, user, socket, message) {
    super(dungeon, user, socket);
    this.message = message || '메시지를 표시합니다.';
  }

  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.MESSAGE;
  }

  async handleInput(responseCode) {
    if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE) {
      sendScreenDone(this.socket);
      this.changeState(ActionState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
