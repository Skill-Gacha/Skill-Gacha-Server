// src/classes/models/userClass.js

import Position from './positionClass.js';
import Stat from './statClass.js';
import { saveRewardSkillsToRedis } from '../../db/redis/skillService.js';

class User {
  constructor(socket, id, element, nickname, maxHp, maxMp, gold, stone, resists) {
    this.socket = socket;
    this.id = id;
    this.element = element;
    this.nickname = nickname;
    this.position = new Position(0, 0, 0, 0);
    this.stat = new Stat(maxHp, maxHp, maxMp, maxMp, resists);
    this.userSkills = [];
    this.items = [];
    this.gold = gold;
    this.stone = stone;
  }

  reduceHp(damage) {
    this.stat.hp = Math.max(0, this.stat.hp - damage);
  }

  reduceMp(mana) {
    this.stat.mp -= mana;
  }

  increaseHpMp(hp, mp) {
    this.stat.hp += hp;
    this.stat.mp += mp;
  }

  resetHpMp() {
    this.stat.hp = this.stat.maxHp;
    this.stat.mp = this.stat.maxMp;
  }

  reduceGold(gold) {
    this.gold -= gold;
  }

  increaseGold(gold) {
    this.gold += gold;
  }

  increaseStone(stone) {
    this.stone += stone;
    // DB에 증가한 강화석 정보 저장
  }

  addSkill(rewardskill) {
    saveRewardSkillsToRedis(this.nickname, rewardskill.id);
    this.userSkills.push(rewardskill);
  }
}

export default User;
