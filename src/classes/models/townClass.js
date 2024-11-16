// src/classes/models/townClass.js

// Game 클래스 상속 받음
import BaseSession from './baseClass.js';

class Town extends BaseSession {
  constructor(townSessionId) {
    super(townSessionId);

    // 마을에 필요한 데이터들 추가

    // 추후 NPC 추가
    // this.npcs = [];
  }

  // Town에 User가 참가
  addUser(user) {
    this.users.push(user);
  }
}

export default Town;
