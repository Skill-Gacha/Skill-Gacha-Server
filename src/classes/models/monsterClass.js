// src/classes/models/user.class.js
import Stat from './statClass.js';
//import Position from './positionClass.js';

class Monster {
  constructor(monsterIdx, monsterModel, monsterName, monsterHp, atk, effectCode) {
    this.monsterIdx = monsterIdx;
    this.monsterModel = monsterModel;
    this.monsterName = monsterName;
    this.monsterHp = monsterHp;
    this.effectCode = effectCode;
    this.atk = atk;
  }
  minusHp(damage) {
    this.monsterHp -= damage;
  }
}

export default Monster;
