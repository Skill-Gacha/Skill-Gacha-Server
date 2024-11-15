// src/classes/models/user.class.js

import Stat from './statClass.js';
import Position from './positionClass.js';

let idCounter = 1;

class User {
  constructor(socket, id, nickname) {
    this.socket = socket;
    this.id = idCounter++;
    this.nickname = nickname;
    // PlayerInfo
    this.playerInfo = {};

    // 위치 정보
    this.position = new Position();

    // 스탯 정보
    this.stat = new Stat();
  }
}

export default User;
