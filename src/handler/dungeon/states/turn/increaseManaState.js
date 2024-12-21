// src/handler/dungeon/states/turn/increaseManaState.js

import DungeonState from '../base/dungeonState.js';
import ActionState from '../action/actionState.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import EnemyAttackState from '../combat/enemyAttackState.js';
import { sendBattleLog, sendPlayerHpMp } from '../../../../utils/battle/dungeonHelpers.js';

const HP_RECOVERY_MIN = 5;
const HP_RECOVERY_MAX = 10;
const MP_RECOVERY_MIN = 5;
const MP_RECOVERY_MAX = 10;
const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class IncreaseManaState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.INCREASE_MANA;
    const randomHp = getRandomInt(HP_RECOVERY_MIN, HP_RECOVERY_MAX);
    const randomMp = getRandomInt(MP_RECOVERY_MIN, MP_RECOVERY_MAX);

    const existingHp = this.user.stat.hp;
    const existingMp = this.user.stat.mp;

    this.user.increaseHpMp(randomHp, randomMp);

    sendPlayerHpMp(this.socket, this.user);

    const battleLogMsg = `체력이 ${this.user.stat.hp - existingHp}만큼 회복하였습니다.\n마나가 ${this.user.stat.mp - existingMp}만큼 회복하였습니다.`;
    this.dungeon.lastActivity = Date.now();
    sendBattleLog(this.socket, battleLogMsg, BUTTON_CONFIRM);
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      if (this.user.turnOff) {
        this.user.turnOff = false;
        this.changeState(EnemyAttackState);
      } else {
        this.changeState(ActionState);
      }
    } else {
      invalidResponseCode(this.socket);
    }
  }
}

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
