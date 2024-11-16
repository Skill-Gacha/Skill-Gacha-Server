// src/classes/models/userClass.js

class Stat {
  constructor(
    level = 1,
    hp = 100,
    maxHp = 100,
    mp = 100,
    maxMp = 100,
    atk = 100,
    def = 100,
    magic = 100,
    speed = 100,
  ) {
    this.level = level;
    this.hp = hp;
    this.maxHp = maxHp;
    this.mp = mp;
    this.maxMp = maxMp;
    this.atk = atk;
    this.def = def;
    this.magic = magic;
    this.speed = speed;    
  }
  updateHp(amount) {
    this.hp = Math.min(this.maxHp, Math.max(0, this.hp + amount));
  }

  updateMp(amount) {
    this.mp = Math.min(this.maxMp, Math.max(0, this.mp + amount));
  }
}

export default Stat;
