// src/handler/boss/states/bossTargetState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossActionState from './bossActionState.js';
import BossEnemyAttackState from './bossEnemyAttackState.js';
import BossRoomState from './bossRoomState.js';

export default class BossTurnChangeState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.TURN_CHANGE;
    this.user.completeTurn = true;

    // 유저의 모든 턴을 마쳤을 때
    const aliveUsers = this.users.filter((user) => !user.isDead);
    const allComplete = aliveUsers.every((user) => user.completeTurn);

    if (allComplete) {
      this.users.forEach((user) => (user.completeTurn = false));
      this.changeState(BossEnemyAttackState);
      return;
    }

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

    this.bossRoom.userTurn = this.user;
    this.changeState(BossActionState);
  }

  async handleInput(responseCode) {}
}
