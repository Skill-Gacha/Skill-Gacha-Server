// src/handler/boss/states/bossTargetState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';

export default class BossTargetState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.TARGET;
  }

  async handleInput(responseCode) {}
}