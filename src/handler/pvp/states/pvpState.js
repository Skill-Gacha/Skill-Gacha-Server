// src/handler/pvp/states/pvpState.js

import GameState from '../../states/gameState.js';

export default class PvpState extends GameState {
  constructor(session, mover, stopper) {
    super(session, mover, mover.socket);
    this.pvpRoom = session;
    this.mover = mover;
    this.stopper = stopper;
  }

  changeState(StateClass, switchTurn = false) {
    if (switchTurn) {
      // mover와 stopper 교체
      const temp = this.mover;
      this.mover = this.stopper;
      this.stopper = temp;
    }
    this.pvpRoom.currentState = new StateClass(this.pvpRoom, this.mover, this.stopper);
    this.pvpRoom.currentState.enter();
  }
}
