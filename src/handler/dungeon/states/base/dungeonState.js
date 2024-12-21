// src/handler/dungeon/states/base/dungeonState.js

import GameState from '../../../states/gameState.js';

// 던전 상태 기본 클래스
// DungeonState를 상속한 모든 상태 클래스는 enter, handleInput 등을 구현.
export default class DungeonState extends GameState {
  constructor(session, user, socket) {
    super(session, user, socket);
    this.dungeon = session;
  }
}