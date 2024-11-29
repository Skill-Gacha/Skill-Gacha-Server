// src/handler/boss/states/bossEnemyAttackState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';

export default class BossEnemyAttackState extends BossRoomState {
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.ENEMY_ATTACK;
  }

  async handleInput(responseCode) {}
}
