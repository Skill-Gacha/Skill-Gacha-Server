// src/handler/dungeon/states/flee/failFleeMessageState.js

import DungeonState from '../base/dungeonState.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import ActionState from '../action/actionState.js';
import { sendBattleLog } from '../../../../utils/battle/dungeonHelpers.js';

const CONFIRM_RESPONSES = { YES: 1 };
const CONFIRM_BUTTONS = [{ msg: '예', enable: true }];

export default class FailFleeMessageState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.FAIL_FLEE;
    sendBattleLog(this.socket, '보유 골드가 부족하여 도망칠 수 없습니다.', CONFIRM_BUTTONS);
  }

  async handleInput(responseCode) {
    if (responseCode === CONFIRM_RESPONSES.YES) {
      this.changeState(ActionState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
