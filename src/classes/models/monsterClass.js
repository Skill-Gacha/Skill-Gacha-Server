// classes/models/monsterClass.js

class Monster {
  constructor(
    monsterIdx,
    monsterModel,
    monsterName,
    monsterHp,
    monsterAtk,
    monsterEffectCode,
    resists,
  ) {
    this.monsterIdx = monsterIdx;
    this.monsterModel = monsterModel;
    this.monsterName = monsterName;
    this.monsterHp = monsterHp;
    this.monsterAtk = monsterAtk;
    this.effectCode = monsterEffectCode;
    this.resistances = {
      electricResist: resists.electricResist || 0,
      earthResist: resists.earthResist || 0,
      grassResist: resists.grassResist || 0,
      fireResist: resists.fireResist || 0,
      waterResist: resists.waterResist || 0,
    };
  }

  reduceHp(amount) {
    this.monsterHp = Math.max(this.monsterHp - amount, 0);
  }
}

export default Monster;
