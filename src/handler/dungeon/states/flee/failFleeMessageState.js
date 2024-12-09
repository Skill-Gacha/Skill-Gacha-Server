// src/handler/dungeon/states/failFleeMessageState.js

import DungeonState from '../base/dungeonState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import ActionState from '../action/actionState.js';

const CONFIRM_RESPONSES = {
  YES: 1,
};

const CONFIRM_BUTTONS = [{ msg: '예', enable: true }];

export default class FailFleeMessageState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.FAIL_FLEE;

    const battleLog = {
      msg: '보유 골드가 부족하여 도망칠 수 없습니다.',
      typingAnimation: false,
      btns: CONFIRM_BUTTONS,
    };
    const response = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(response);
  }

  async handleInput(responseCode) {
    if (responseCode === CONFIRM_RESPONSES.YES) {
      this.changeState(ActionState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
