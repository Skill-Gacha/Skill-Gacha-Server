// src/classes/models/user.class.js

import Stat from './statClass.js';
import Position from './positionClass.js';

class Monster {
  constructor(monsterId, monsterIdx, monsterModel, monsterName, monsterHp, effectCode, atk) {
    this.monsterId = monsterId;
    this.monsterIdx = monsterIdx;
    this.monsterModel = monsterModel;
    this.monsterName = monsterName;
    this.monsterHp = monsterHp;
    this.effectCode = effectCode;
    this.atk = atk;
  }
}

export default Monster;
