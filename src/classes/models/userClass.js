// src/classes/models/user.class.js

import Stat from './statClass.js';
import Position from './positionClass.js';

class User {

  constructor(socket, id, nickname) {
    this.socket = socket;
    this.id = id;
    this.nickname = nickname;

    // 클래스 정보
    // 속성 구분을 위해 사용
    this.job = 0;

    // 이모트용 감정표현 코드
    this.animCode = 0;

    // 위치 정보
    this.position = new Position();

    // 스탯 정보
    this.stat = new Stat();
  }

  updateAnimCode(animCode) {
    this.animCode = animCode;
  }
}

export default User;
