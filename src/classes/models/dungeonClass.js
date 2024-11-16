// src/classes/models/DungeonClass.js

import BaseSession from './BaseSessionClass.js';
import { STATE_MESSAGE_WINDOW } from '../../constants/constants.js';

class Dungeon extends BaseSession {
  constructor(dungeonId, dungeonCode, mode = 0) {
    super(dungeonId);
    this.dungeonCode = dungeonCode;
    this.users = [];
    this.battleLog = [];
    this.monsters = [];
    this.currentBattleState = STATE_MESSAGE_WINDOW;
    this.currentTurn = 0;
    this.target = null;
    this.targetIdx = null;
    this.selectedItem = null;
    this.mode = mode; // PvE = 0, PvP = 1
  }
  
  addUser(user) {
    this.users.push(user);
  }
  
  addMonster(monster) {
    this.monsters.push(monster);
  }
}

export default Dungeon;
