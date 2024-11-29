// src/handler/boss/states/bossPlayerUseItemState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';

export default class BossPlayerUseItemState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.USE_ITEM;
  }

  async handleInput(responseCode) {}
}
