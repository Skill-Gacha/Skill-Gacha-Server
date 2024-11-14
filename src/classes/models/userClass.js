// src/classes/models/user.class.js

import Stat from './statClass.js';
import Position from './positionClass.js';

class User {
  constructor(socket, id, nickname, job, animCode) {
    this.socket = socket;
    this.id = id;
    this.nickname = nickname;

    // 클래스 정보
    // 속성 구분을 위해 사용
    this.job = job;

    // 이모트용 감정표현 코드
    this.animCode = animCode;

    // 위치 정보
    this.position = new Position();

    //스탯 정보
    this.stat = new Stat();
  }

  updateUserHp(damage) {
    this.stat.hp = Math.max(0, this.stat.hp - damage); // 체력이 0 이하로 떨어지지 않도록 처리
  }
}

export default User;
