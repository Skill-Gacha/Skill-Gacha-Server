// src/handler/boss/states/turn/bossTurnChangeState.js

import { BOSS_STATUS } from '../../../../constants/battle.js';
import { delay } from '../../../../utils/delay.js';
import BossActionState from '../action/bossActionState.js';
import BossRoomState from '../base/bossRoomState.js';
import BossEnemyAttackState from '../combat/bossEnemyAttackState.js';

export default class BossTurnChangeState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.TURN_CHANGE;

    let currentIdx = this.users.findIndex((user) => user.id === this.user.id);

    if (currentIdx === -1) {
      console.error('존재하지 않는 유저입니다.');
      return;
    }

    do {
      currentIdx = (currentIdx + 1) % this.users.length;
      this.user = this.users[currentIdx];
    } while (this.user.isDead);

    const aliveUsers = this.users.filter((user) => !user.isDead);
    const allComplete = aliveUsers.every((user) => user.completeTurn);
    this.bossRoom.userTurn = this.user;

    if (allComplete) {
      this.users.forEach((user) => (user.completeTurn = false));
      this.bossRoom.clearTurnTimer();
      await delay(1000);
      this.changeState(BossEnemyAttackState);
      return;
    }

    this.bossRoom.lastActivity = Date.now();

    this.changeState(BossActionState);
  }

  async handleInput(responseCode) {}
}
