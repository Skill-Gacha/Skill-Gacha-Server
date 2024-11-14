// src/classes/models/user.class.js

import Stat from './statClass.js';
import Position from './positionClass.js';

class Monster {

  constructor(socket, id, nickname) {
    this.monsterId = id;  // 몬스터 마다의 고유 ID
    
    this.monsterIdx = 0;  // 고유 ID 아님!
    this.monsterModel = 0;
    this.monsterName = 'monster_name';
    this.monsterHp = 0;
    
    // 혹시 모르는 실시간
    // this.position = new Position();
  }
}

export default Monster;
