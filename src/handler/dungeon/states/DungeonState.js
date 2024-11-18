// src/handlers/dungeon/states/DungeonState.js

export default class DungeonState {
  constructor(dungeon, user, socket) {
    this.dungeon = dungeon;
    this.user = user;
    this.socket = socket;
  }

  async enter() {
    throw new Error('enter() 메서드는 서브클래스에서 구현해야 합니다.');
  }

  async handleInput(responseCode) {
    throw new Error('handleInput() 메서드는 서브클래스에서 구현해야 합니다.');
  }

  changeState(StateClass) {
    this.dungeon.currentState = new StateClass(this.dungeon, this.user, this.socket);
    this.dungeon.currentState.enter();
  }
}
