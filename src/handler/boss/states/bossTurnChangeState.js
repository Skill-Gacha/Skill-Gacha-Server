// src/handler/boss/states/bossTargetState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';

export default class BossTurnChangeState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.TURN_CHANGE;

    // 현재 유저의 인덱스
    let currentIdx = this.users.findIndex((user) => user.id === this.user.id);

    if (currentIdx === -1) {
      console.error('존재하지 않는 유저입니다.');
      return;
    }

    // 최소 한번은 실행하고 살아있는 유저를 찾아 턴 넘겨주기
    do {
      const currentIdx = (currentIdx + 1) % this.users.length;
      this.user = this.users[currentIdx];
    } while (this.user.isDead);
  }

  async handleInput(responseCode) {}
}
