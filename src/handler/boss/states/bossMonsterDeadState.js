// src/handler/boss/states/bossMonsterDeadState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';

export default class BossMonsterDeadState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.MONSTER_DEAD;
  }

  async handleInput(responseCode) {}
}
