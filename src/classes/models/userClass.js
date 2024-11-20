// src/classes/models/userClass.js

import Position from './positionClass.js';
import Stat from './statClass.js';
import { saveRewardSkillsToRedis } from '../../db/redis/skillService.js';

class User {
  constructor(socket, id, element, nickname, maxHp, maxMp, gold, stone) {
    this.socket = socket;
    this.id = id;
    this.element = element;
    this.nickname = nickname;
    this.position = new Position(0, 0, 0, 0);
    this.stat = new Stat(maxHp, maxHp, maxMp, maxMp);
    this.userSkills = []; // 생성될 때는 빈 배열로 초기화 레디스를 통해 디비에서 유저의 스킬 정보를 가져온다(스킬 전체 정보를 가지고 있다)
    this.gold = gold;
    this.stone = stone;
  }

  reduceHp(damage) {
    this.stat.hp = Math.max(0, this.stat.hp - damage);
  }

  reduceMp(mana) {
    this.stat.mp -= mana;
  }

  resetHpMp() {
    this.stat.hp = this.stat.maxHp;
    this.stat.mp = this.stat.maxMp;
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
