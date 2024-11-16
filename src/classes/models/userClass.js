// src/classes/models/user.class.js

import Stat from './statClass.js';
import Position from './positionClass.js';

class User {
  constructor(socket, id, nickname) {
    this.socket = socket;
    this.id = id;
    this.nickname = nickname;
    // PlayerInfo
    this.playerInfo = {};

    // 위치 정보
    this.position = new Position();

    // 스탯 정보
    this.stat = new Stat();
  }

  updateUserHp(damage) {
    this.stat.hp = Math.max(0, this.stat.hp - damage); // 체력이 0 이하로 떨어지지 않도록 처리
  }
  resetUserHpMp() {
    this.stat.hp = this.stat.maxHp;
    this.stat.mp = this.stat.maxMp;
  }
}

export default User;
