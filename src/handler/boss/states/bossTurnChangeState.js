// src/handler/boss/states/bossTurnChangeState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import { delay } from '../../../utils/delay.js';
import BossActionState from './bossActionState.js';
import BossEnemyAttackState from './bossEnemyAttackState.js';
import BossRoomState from './bossRoomState.js';

export default class BossTurnChangeState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.TURN_CHANGE;

    // 다른 유저로 턴 넘기기
    let currentIdx = this.users.findIndex((user) => user.id === this.user.id);

    if (currentIdx === -1) {
      console.error('존재하지 않는 유저입니다.');
      return;
    }

    // 최소 한번은 실행하고 살아있는 유저를 찾아 턴 넘겨주기
    do {
      currentIdx = (currentIdx + 1) % this.users.length;
      this.user = this.users[currentIdx];
    } while (this.user.isDead);

    // 유저의 모든 턴을 마쳤을 때
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
