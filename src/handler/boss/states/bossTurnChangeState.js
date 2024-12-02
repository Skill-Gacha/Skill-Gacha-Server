// src/handler/boss/states/bossTargetState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossActionState from './bossActionState.js';
import BossEnemyAttackState from './bossEnemyAttackState.js';
import BossRoomState from './bossRoomState.js';

export default class BossTurnChangeState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.TURN_CHANGE;

    // 유저의 모든 턴을 마쳤을 때
    this.user.completeTurn = true;
    const allComplete = this.users.every((user) => user.completeTurn);
    if (allComplete) {
      this.changeState(BossEnemyAttackState);
      this.users.forEach((user) => (user.completeTurn = false));
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

    // 턴 구분 패킷 전송
    this.users.forEach((user) => {
      user.socket.write(createResponse(PacketType.S_BossUserTurn, { playerId: this.user.id }));
    });

    this.changeState(BossActionState);
  }

  async handleInput(responseCode) {}
}
