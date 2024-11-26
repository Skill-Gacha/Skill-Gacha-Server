// src/handler/states/gameState.js

export default class GameState {
  constructor(session, user, socket) {
    if (new.target === GameState) {
      throw new Error('GameState는 추상 클래스입니다.');
    }
    this.session = session;
    this.user = user;
    this.socket = socket;
  }

  async enter() {
    throw new Error('enter()를 구현해야 합니다.');
  }

  async handleInput(responseCode) {
    throw new Error('handleInput()을 구현해야 합니다.');
  }

  changeState(StateClass) {
    this.session.currentState = new StateClass(this.session, this.user, this.socket);
    this.session.currentState.enter();
  }
}
