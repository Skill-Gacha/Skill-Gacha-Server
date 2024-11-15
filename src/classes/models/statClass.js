﻿// src/classes/models/userClass.js

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
