// src/handler/boss/states/bossPlayerDeadState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';

export default class BossPlayerDeadState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.PLAYER_DEAD;
  }

  async handleInput(responseCode) {}
}
