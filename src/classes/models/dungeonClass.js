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
    this.selectedItem = null;
    this.dungeonStatus = null;
  }

  addMonster(monster) {
    this.monsters.push(monster);
  }

  // 리워드 데이터 초기화 함수
  initReward() {
    const gold = this.calculateGold();
    const stone = this.calculateStone();
    const rewardSkills = getRandomRewardSkills(this.dungeonCode);
    const item = this.generateRandomItem();

    return new Reward(gold, stone, rewardSkills, item);
  }

  calculateGold() {
    const baseGold = 100;
    return this.dungeonCode * baseGold;
  }

  calculateStone() {
    const baseStone = 1;
    return this.dungeonCode * baseStone;
  }

  generateRandomItem() {
    if (Math.random() < 0.02) {
      const itemIds = [4004, 4005];
      return itemIds[Math.floor(Math.random() * itemIds.length)];
    }
    return null;
  }
}

export default Dungeon;
