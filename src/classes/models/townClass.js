// src/classes/models/townClass.js

import Game from './gameClass.js';

// Game 클래스 상속 받음
class Town extends Game {
  constructor(townSessionId) {
    super(townSessionId);

    // 마을에 필요한 데이터들 추가

    // 추후 NPC 추가
    // this.npcs = [];
  }
}

export default Town;
