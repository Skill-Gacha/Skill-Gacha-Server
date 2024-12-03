// src/handler/boss/states/bossRoomState.js

import GameState from '../../states/gameState.js';

export default class BossRoomState extends GameState {
  constructor(session, user) {
    super(session, user);
    this.bossRoom = session;
    this.users = this.bossRoom.getUsers();
  }
}
