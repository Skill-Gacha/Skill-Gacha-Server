// src/classes/models/dungeonClass.js

import { getRandomSkills } from '../../init/loadAssets.js';
import BaseSession from './baseSession.js';
import Reward from './rewardClass.js';

class Dungeon extends BaseSession {
  constructor(dungeonId, dungeonCode) {
    super(dungeonId);
    this.monsters = [];
    this.dungeonCode = dungeonCode;
    this.currentState = null;
    this.reward = this.initReward();

    this.dungeonStatus = null;
    // this.selectedMonster = null;
  }

  addMonster(monster) {
    this.monsters.push(monster);
  }

  // 리워드 데이터 초기화 함수
  initReward() {
    const gold = this.dungeonCode * 100;
    const stone = this.dungeonCode * 1;
    const skills = getRandomSkills(this.dungeonCode);

    return new Reward(gold, stone, skills);
  }
}

export default Dungeon;
