// src/classes/models/userClass.js

import Position from './positionClass.js';
import Stat from './statClass.js';

class User {
  constructor(socket, id, nickname, maxHp, maxMp, atk, def, magic, speed) {
    this.socket = socket;
    this.id = id;
    this.nickname = nickname;
    this.position = new Position(0, 0, 0, 0);
    this.stat = new Stat(1, maxHp, maxHp, maxMp, maxMp, atk, def, magic, speed);
    this.skills = []; // 스킬 id만 가지고 있다(레디스를 통해 실시간으로 가져와서 사용할 예정)
    this.gold = 0;
    this.stone = 0;
  }

  reduceHp(damage) {
    this.stat.hp = Math.max(0, this.stat.hp - damage);
  }

  resetHpMp() {
    this.stat.hp = this.stat.maxHp;
    this.stat.mp = this.stat.maxMp;
  }

  reduceReward(damage) {
    this.stat.hp = Math.max(0, this.stat.hp - damage);
  }
}

export default User;
