// src/classes/models/userClass.js

class Stat {
  constructor(level, hp, maxHp, mp, maxMp, atk, def, magic, speed) {
    this.level = level;
    this.hp = hp;
    this.maxHp = maxHp;
    this.mp = mp;
    this.maxMP = maxMp;
    this.atk = atk;
    this.def = def;
    this.magic = magic;
    this.speed = speed;
  }
}

export default Stat;
