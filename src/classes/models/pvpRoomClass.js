import BaseSession from './baseSession.js';

// 매칭 큐를 통해 게임이 잡힌 유저 2명의 대한 방
class PvpRoomClass extends BaseSession {
  constructor(pvpId) {
    super(pvpId);
    this.currentState = null;
    this.pvpStatus = null;
    this.userTurn = null;
    this.selectedSkill;
  }

  setUserTurn(values) {
    this.userTurn = values;
  }

  getUserTurn() {
    return this.userTurn;
  }
}

export default PvpRoomClass;
