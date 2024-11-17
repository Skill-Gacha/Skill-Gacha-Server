// classes/models/monsterClass.js

class Monster {
  constructor(monsterIdx, monsterModel, monsterName, monsterHp, monsterAtk, monsterEffectCode) {
    this.monsterIdx = monsterIdx;
    this.monsterModel = monsterModel;
    this.monsterName = monsterName;
    this.monsterHp = monsterHp;
    this.monsterAtk = monsterAtk;
    this.effectCode = monsterEffectCode;
  }

  minusHp(amount) {
    this.monsterHp = Math.max(this.monsterHp - amount, 0);
  }
}

export default Monster;
