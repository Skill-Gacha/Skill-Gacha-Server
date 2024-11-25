// src/handler/pvp/states/pvpState.js

import GameState from '../../states/gameState.js';

export default class PvpState extends GameState {
  constructor(session, mover, stopper) {
    super(session, mover, mover.socket);
    this.pvpRoom = session; // 세션을 PVP 룸으로 명시적으로 설정
    this.mover = mover;
    this.stopper = stopper;
  }

  changeState(StateClass) {
    // 턴 교체 로직 추가
    const [playerA, playerB] = Array.from(this.pvpRoom.users.values());

    if (this.pvpRoom.getUserTurn() === 0) {
      this.mover = playerB;
      this.stopper = playerA;
    } else {
      this.mover = playerA;
      this.stopper = playerB;
    }

    this.pvpRoom.currentState = new StateClass(this.pvpRoom, this.mover, this.stopper);
    this.pvpRoom.currentState.enter();
  }
}
