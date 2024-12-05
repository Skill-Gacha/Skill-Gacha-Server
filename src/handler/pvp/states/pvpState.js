// src/handler/pvp/states/pvpState.js

import GameState from '../../states/gameState.js';

export default class PvpState extends GameState {
  constructor(session, mover, stopper) {
    super(session, mover, mover.socket);
    this.pvpRoom = session;
    this.mover = mover;
    this.stopper = stopper;
  }

  // changeState(StateClass, options = {})
  // 위와 같은 형태로 여러 옵션 넘겨주기 가능
  // 지금 당장은 필요없으므로 하던대로 사용
  async changeState(StateClass, switchTurn = false) {
    if (switchTurn) {
      // 구조 분해 할당으로 스왑
      [this.mover, this.stopper] = [this.stopper, this.mover];
    }
    this.pvpRoom.currentState = new StateClass(this.pvpRoom, this.mover, this.stopper);
    await this.pvpRoom.currentState.enter();
  }
}
