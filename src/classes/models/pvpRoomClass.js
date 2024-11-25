import BaseSession from './baseSession.js';

// 매칭 큐를 통해 게임이 잡힌 유저 2명의 대한 방
class PvpRoomClass extends BaseSession {
  constructor(pvpId) {
    super(pvpId);
    this.currentState = null;
    this.pvpStatus = null;
    this.userTurn = null;
    this.selectedSkill = null;
  }

  // 어느 유저의 차례인지 결정해주는 함수

  setUserTurn() {
    if (this.userTurn === null) {
      this.userTurn = Math.random() > 0.5 ? 0 : 1;
    } else if (this.userTurn === 0) {
      this.userTurn = 1;
    } else {
      this.userTurn = 0;
    }
  }

  getUserTurn() {
    return this.userTurn;
  }
}

export default PvpRoomClass;
