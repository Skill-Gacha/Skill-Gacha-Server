﻿// src/classes/models/statClass.js

class Stat {
  constructor(hp, maxHp, mp, maxMp, resists) {
    this.hp = hp;
    this.maxHp = maxHp;
    this.mp = mp;
    this.maxMp = maxMp;
    this.buff = null;
    this.berserk = false;
    this.dangerPotion = false;
    this.protect = false;
    this.debuff = false; // 저항력 0으로 만들어주기?

    this.resistances = {
      electricResist: resists.electricResist,
      earthResist: resists.earthResist,
      grassResist: resists.grassResist,
      fireResist: resists.fireResist,
      waterResist: resists.waterResist,
    };

    this.originalResistances = { ...this.resistances };
  }
}

export default Stat;
