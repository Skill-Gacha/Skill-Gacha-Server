// src/handler/dungeon/states/combat/playerDeadState.js

import DungeonState from '../base/dungeonState.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import GameOverLoseState from '../result/gameOverLoseState.js';
import { deadResource } from '../../../../utils/battle/calculate.js';
import { sendBattleLog } from '../../../../utils/battle/dungeonHelpers.js';

const RESPONSE_CODE = {
  SCREEN_TEXT_DONE: 1,
};

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class PlayerDeadState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.PLAYER_DEAD;
    const gold = this.user.gold;
    const stone = this.user.stone;

    deadResource(this.user, this.dungeon.dungeonCode);

    const goldLost = gold - this.user.gold;
    const stoneLost = stone - this.user.stone;

    const msg = `체력이 0이 되어 사망하였습니다.\n골드를 ${goldLost}원 잃었습니다.\n강화석 ${stoneLost}개 잃었습니다.`;
    sendBattleLog(this.socket, msg, BUTTON_CONFIRM);
  }

  async handleInput(responseCode) {
    if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE) {
      this.changeState(GameOverLoseState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
