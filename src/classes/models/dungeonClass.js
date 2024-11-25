// src/classes/models/dungeonClass.js

import { getRandomRewardSkills } from '../../init/loadAssets.js';
import BaseSession from './baseSession.js';
import Reward from './rewardClass.js';

class Dungeon extends BaseSession {
  constructor(dungeonId, dungeonCode) {
    super(dungeonId);
    this.monsters = [];
    this.dungeonCode = dungeonCode;
    this.currentState = null;
    this.reward = this.initReward();
    this.selectedSkill = null;
    this.newSkill = null;

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
    const rewardSkills = getRandomRewardSkills(this.dungeonCode);
    let item = null;
    if (Math.random() < 0.1) {
      // 4004 4005 둘중 하나
      const ittmeIds = [4004, 4005];
      item = ittmeIds[Math.floor(Math.random() * 2)];
    }

    return new Reward(gold, stone, rewardSkills, item);
  }
}

export default Dungeon;
