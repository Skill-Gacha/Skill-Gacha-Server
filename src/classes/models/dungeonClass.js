// src/classes/models/dungeonClass.js

import BaseSession from './baseSession.js';

class Dungeon extends BaseSession {
  constructor(dungeonId, dungeonCode) {
    super(dungeonId);
    this.monsters = [];
    this.dungeonCode = dungeonCode;
    this.currentState = null;


    this.dungeonStatus = null;
    // this.selectedMonster = null;
  }

  addMonster(monster) {
    this.monsters.push(monster);
  }
}

export default Dungeon;
