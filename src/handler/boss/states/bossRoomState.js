// src/handler/boss/states/bossRoomState.js

import GameState from '../../states/gameState.js';

export default class BossRoomState extends GameState {
  constructor(session, user, socket) {
    super(session, user, socket);
    this.bossRoom = session;
    this.user = this.bossRoom.userTurn;
    this.users = this.bossRoom.getUsers();
    this.element = null; //보스의 속성
    this.shieldAmount = 1000; // 쉴드
  }
}
