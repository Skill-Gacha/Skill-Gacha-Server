// src/classes/models/dungeonClass.js

import BaseSession from './BaseSession.js';

class Dungeon extends BaseSession {
  constructor(dungeonId, dungeonCode) {
    super(dungeonId);
    this.monsters = [];
    this.dungeonCode = dungeonCode;
  }

  addMonster(monster) {
    this.monsters.push(monster);
  }

  // 필요에 따라 추가적인 던전 관련 메서드
}

export default Dungeon;
