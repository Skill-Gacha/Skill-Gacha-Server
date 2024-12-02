// src/handler/dungeon/states/dungeonState.js

import GameState from '../../states/gameState.js';

export default class DungeonState extends GameState {
  constructor(session, user, socket) {
    super(session, user, socket);
    this.dungeon = session; // 세션을 던전으로 명시적으로 설정
  }

}
