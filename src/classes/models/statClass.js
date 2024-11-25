// src/classes/models/statClass.js

class Stat {
  constructor(hp, maxHp, mp, maxMp, resists) {
    this.hp = hp;
    this.maxHp = maxHp;
    this.mp = mp;
    this.maxMp = maxMp;
    this.berserk = false;
    this.dangerPotion = false;
    this.protect = false;
    this.resistbuff = false;

    this.resistances = {
      electricResist: resists.electricResist,
      earthResist: resists.earthResist,
      grassResist: resists.grassResist,
      fireResist: resists.fireResist,
      waterResist: resists.waterResist,
    };
  }
}

export default Stat;
