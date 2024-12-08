// src/handler/states/gameState.js

import { ErrorCodes } from '../../utils/error/errorCodes.js';
import CustomError from '../../utils/error/customError.js';

export default class GameState {
  constructor(session, user, socket) {
    if (new.target === GameState) {
      throw new CustomError(ErrorCodes.ABSTRACT_CLASS, 'GameState는 추상 클래스입니다.');
    }
    this.session = session;
    this.user = user;
    this.socket = socket;
  }

  async enter() {
    throw new CustomError(ErrorCodes.ABSTRACT_CLASS, 'enter()를 구현해야 합니다.');
  }

  async handleInput(responseCode) {
    throw new CustomError(ErrorCodes.ABSTRACT_CLASS, 'handleInput()을 구현해야 합니다.');
  }

  async changeState(StateClass) {
    this.session.currentState = new StateClass(this.session, this.user, this.socket);
    await this.session.currentState.enter();
  }
}
