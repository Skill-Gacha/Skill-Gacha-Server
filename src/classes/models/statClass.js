// src/classes/models/userClass.js

class Stat {
  constructor(hp, maxHp, mp, maxMp, resists) {
    this.hp = hp;
    this.maxHp = maxHp;
    this.mp = mp;
    this.maxMp = maxMp;
    this.resistances = {
      electricResist: resists.electricResist,
      eartgResist: resists.eartgResist,
      grassResist: resists.grassResist,
      fireResist: resists.fireResist,
      waterResist: resists.waterResist,
    };

    // this.resistances = {
    //   water: resistances.water || 0, // 물 저항
    //   fire: resistances.fire || 0, // 불 저항
    //   grass: resistances.grass || 0, // 풀 저항
    //   ground: resistances.ground || 0, // 땅 저항
    //   electric: resistances.electric || 0, // 전기 저항
    // };
  }
}

export default Stat;
