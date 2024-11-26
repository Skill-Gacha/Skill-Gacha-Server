import BaseSession from './baseSession.js';

const PLAYER_A = 0;
const PLAYER_B = 1;

// 매칭 큐를 통해 게임이 잡힌 유저 2명의 대한 방
class PvpRoomClass extends BaseSession {
  constructor(pvpId) {
    super(pvpId);
    this.currentState = null;
    this.pvpStatus = null;
    this.userTurn = null;
    this.selectedSkill = null;
  }

  initializeTurn() {
    this.userTurn = Math.random() > 0.5 ? PLAYER_A : PLAYER_B;
  }

  switchTurn() {
    this.userTurn = this.userTurn === PLAYER_A ? PLAYER_B : PLAYER_A;
  }

  getUserTurn() {
    return this.userTurn;
  }
}

export default PvpRoomClass;
