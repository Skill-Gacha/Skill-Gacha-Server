// src/handler/dungeon/states/messageState.js

import DungeonState from '../base/dungeonState.js';
import ActionState from '../action/actionState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';

const RESPONSE_CODE = {
  SCREEN_TEXT_DONE: 0,
};

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
      const screenTextDoneResponse = createResponse(PacketType.S_ScreenDone, {});
      this.socket.write(screenTextDoneResponse);

      this.changeState(ActionState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
