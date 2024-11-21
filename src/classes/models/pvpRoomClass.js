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

  // 어느 유저의 차례인지 결정해주는 함수

  setUserTurn(values) {
    this.userTurn = values;
    // setUserTurn가 true이면 users 배열 내
    // index가 0번인 녀석의 행동 차례

    // setUserTurn가 false이면 users 배열 내
    // index가 1번인 녀석의 해동 차례
  }

  getUserTurn() {
    return this.userTurn;
  }
}

export default PvpRoomClass;
