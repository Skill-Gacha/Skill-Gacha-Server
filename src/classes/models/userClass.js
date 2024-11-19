// src/classes/models/userClass.js

import Stat from './statClass.js';
import Position from './positionClass.js';

class User {
  constructor(socket, id, element, nickname, maxHp, maxMp) {
    this.socket = socket;
    this.id = id;
    this.element = element;
    this.nickname = nickname;
    this.skills = [];
    this.stat = new Stat(maxHp, maxHp, maxMp, maxMp);

    this.position = new Position(0, 0, 0, 0);
  }

  reduceHp(damage) {
    this.stat.hp = Math.max(0, this.stat.hp - damage);
  }

  resetHpMp() {
    this.stat.hp = this.stat.maxHp;
    this.stat.mp = this.stat.maxMp;
  }
}

export default User;
