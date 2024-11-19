// src/handler/pvp/states/pvpState.js

// PvpState 클래스는 단독으로 사용 불가능
// 모든 상태는 이 클래스를 상속받아 구현되어야 함
// PvP도 PVPState 같은 식으로 만들어 할 수 있을듯?
export default class PvpState {
  constructor(pvpRoom, mover, stopper) {
    if (new.target === PvpState) {
      throw new Error('PvpState는 추상 클래스입니다. 인스턴스를 생성할 수 없습니다.');
    }

    this.pvpRoom = pvpRoom;
    this.mover = mover;
    //행동을 할 사람
    this.stopper = stopper;
    //행동을 할 기회가 아닌 사람
  }

  // 차례에 맞는 유저로 바꿔주는 setter 함수
  set mover(value) {
    this.mover = value;
  }

  // 차례에 맞는 유저를 가져오는 getter 함수
  get mover() {
    return this.mover;
  }
  // 멈춰 있는 사람의 차례에 맞는 유저로 바꿔주는 setter 함수
  set stopper(value) {
    this.stopper = value;
  }
  // 멈춰 있는 사람의 차례에 맞는 유저로 바꿔주는 getter 함수
  get stopper() {
    return this.stopper;
  }

  // 상태 전환 시 첫 호출되는 함수
  async enter() {
    throw new Error('enter()는 상속을 받아 구현해야 합니다.');
  }

  // 클라이언트로부터의 응답 코드를 처리하는 함수
  async handleInput(responseCode) {
    throw new Error('handleInput()는 상속을 받아 구현해야 합니다.');
  }

  // 상태를 바꿀 때 호출되는 함수
  // 넘어가면 바로 enter()를 호출함
  changeState(StateClass) {
    this.pvp.currentState = new StateClass(this.pvpRoom, this.mover, this.stopper);
    this.pvp.currentState.enter();
  }
}
