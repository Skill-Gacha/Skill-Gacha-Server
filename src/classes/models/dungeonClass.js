// src/classes/models/dungeonClass.js

import { DUNGEON_RESOURCES } from '../../constants/battle.js';
import { ITEM_ID } from '../../constants/items.js';
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
    this.stoneCount = 0;
  }

  addMonster(monster) {
    this.monsters.push(monster);
  }

  // 리워드 데이터 초기화 함수
  initReward() {
    const gold = this.calculateGold(this.dungeonCode);
    const stone = this.calculateStone(this.dungeonCode);
    const rewardSkills = getRandomRewardSkills(this.dungeonCode);
    const item = this.generateRandomItem();

    return new Reward(gold, stone, rewardSkills, item);
  }

  calculateGold(dungeonCode) {
    const resource = DUNGEON_RESOURCES[dungeonCode];
    return resource.gold;
  }

  calculateStone(dungeonCode) {
    const resource = DUNGEON_RESOURCES[dungeonCode];
    return resource.stone;
  }

  generateRandomItem() {
    const random = Math.random();
    if (random < 0.02) {
      return ITEM_ID.DANGER_POTION; // 2프로 확률로 이상한 물약
    } else if (random < 0.12) {
      return ITEM_ID.PANACEA; // 10프로 확률로 만병통치약
    }
    return null;
  }
}

export default Dungeon;
