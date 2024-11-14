// src/classes/models/townClass.js

import BaseSession from './BaseSessionClass.js';

// Game 클래스 상속 받음
class Town extends BaseSession {
  constructor(townSessionId) {
    super(townSessionId);

    // 마을에 필요한 데이터들 추가

    // 추후 NPC 추가
    // this.npcs = [];
  }
  addUser(user) {
    this.users.push(user);
  }
}

export default Town;
