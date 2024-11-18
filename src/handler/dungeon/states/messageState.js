// src/handlers/dungeon/states/MessageState.js

import DungeonState from './dungeonState.js';
import ActionState from './actionState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

export default class MessageState extends DungeonState {
  constructor(dungeon, user, socket, message) {
    super(dungeon, user, socket);
    this.message = message || '메시지를 표시합니다.';
  }

  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.MESSAGE;
  }

  async handleInput(responseCode) {
    if (responseCode === 0) {
      // S_ScreenDone 패킷 전송
      const screenTextDoneResponse = createResponse(PacketType.S_ScreenDone, {});
      this.socket.write(screenTextDoneResponse);

      // 행동 선택 상태로 전환
      this.changeState(ActionState);
    }
  }
}
