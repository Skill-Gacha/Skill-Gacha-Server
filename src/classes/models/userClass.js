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
}

export default User;
