// src/handler/dungeon/states/dungeonState.js

export default class DungeonState {
  constructor(dungeon, user, socket) {
    this.dungeon = dungeon;
    this.user = user;
    this.socket = socket;
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
    this.dungeon.currentState = new StateClass(this.dungeon, this.user, this.socket);
    this.dungeon.currentState.enter();
  }
}
