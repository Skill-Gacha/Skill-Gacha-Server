// src/handler/dungeon/states/dungeonState.js

import GameState from '../../states/gameState.js';

export default class BossRoomState extends GameState {
  constructor(session) {
    super(session, user);
    this.bossRoom = session;
    this.user = this.bossRoom.userTurn;
  }
}