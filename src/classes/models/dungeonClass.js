// src/classes/models/dungeonClass.js

import BaseSession from './baseSession.js';
import { DUNGEON_STATUS } from '../../constants/battle.js';

class Dungeon extends BaseSession {
  constructor(dungeonId, dungeonCode) {
    super(dungeonId);
    this.monsters = [];
    this.dungeonCode = dungeonCode;
    this.dungeonStatus = DUNGEON_STATUS.MESSAGE; // 초기 상태 설정
    this.selectedMonster = null;
  }

  addMonster(monster) {
    this.monsters.push(monster);
  }
}

export default Dungeon;
