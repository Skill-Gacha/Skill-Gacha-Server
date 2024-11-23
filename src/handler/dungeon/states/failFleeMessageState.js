// src/handler/dungeon/states/fleeMessageState.js

import DungeonState from './dungeonState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import ActionState from './actionState.js';

export default class FailFleeMessageState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.FAIL_FLEE;

    const battleLog = {
      msg: '보유 골드가 부족하여 도망칠 수 없습니다.',
      typingAnimation: false,
      btns: [{ msg: '예', enable: true }],
    };
    const failFreeBattlelogResponse = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(failFreeBattlelogResponse);
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      this.changeState(ActionState);
    } else {
      // responseCode 유효성 검사
      invalidResponseCode(this.socket);
    }
  }
}
