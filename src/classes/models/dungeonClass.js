// src/classes/models/dungeonClass.js

import BaseSession from './BaseSession.js';
import { D_STATE_BATTLE } from '../../constants/battle.js';

class Dungeon extends BaseSession {
  constructor(dungeonId, dungeonCode) {
    super(dungeonId);
    this.monsters = [];
    this.dungeonCode = dungeonCode;
    this.dungeonStatus = D_STATE_BATTLE;
  }

  addMonster(monster) {
    this.monsters.push(monster);
  }

  // 필요에 따라 함수 추가
}

export default Dungeon;
