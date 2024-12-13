// src/handler/pvp/states/base/pvpState.js

import GameState from '../../../states/gameState.js';

// PvP 상태 기본 클래스
export default class PvpState extends GameState {
  constructor(session, mover, stopper) {
    super(session, mover, mover.socket);
    this.pvpRoom = session;
    this.mover = mover;
    this.stopper = stopper;
  }

  async changeState(StateClass, switchTurn = false) {
    if (switchTurn) {
      [this.mover, this.stopper] = [this.stopper, this.mover];
    }
    this.pvpRoom.currentState = new StateClass(this.pvpRoom, this.mover, this.stopper);
    await this.pvpRoom.currentState.enter();
  }
}
