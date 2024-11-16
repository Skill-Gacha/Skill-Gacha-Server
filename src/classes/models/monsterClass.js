// src/classes/models/MonsterClass.js

class Monster {
  constructor(monsterIdx, monsterModel, monsterName, monsterHp, effectCode, atk) {
    this.monsterIdx = monsterIdx;
    this.monsterModel = monsterModel;
    this.monsterName = monsterName;
    this.stat = {
      hp: monsterHp,
      maxHp: monsterHp,
      atk: atk,
    };
    this.effectCode = effectCode;
    this.isDead = false;
  }
}

export default Monster;
