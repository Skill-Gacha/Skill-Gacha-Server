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
      electricResist: resists.electricResist,
      eartgResist: resists.eartgResist,
      grassResist: resists.grassResist,
      fireResist: resists.fireResist,
      waterResist: resists.waterResist,
    };
  }

  reduceHp(amount) {
    this.monsterHp = Math.max(this.monsterHp - amount, 0);
  }
}

export default Monster;
