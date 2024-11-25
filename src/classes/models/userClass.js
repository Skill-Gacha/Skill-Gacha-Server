// src/classes/models/userClass.js

import Position from './positionClass.js';
import Stat from './statClass.js';
import { updateUserResource } from '../../db/user/user.db.js';

class User {
  constructor(socket, id, element, nickname, maxHp, maxMp, gold, stone, resists) {
    this.socket = socket;
    this.id = id;
    this.element = element;
    this.nickname = nickname;
    this.position = new Position(0, 0, 0, 0);
    this.stat = new Stat(maxHp, maxHp, maxMp, maxMp, resists);
    this.userSkills = []; // 생성될 때는 빈 배열로 초기화 레디스를 통해 디비에서 유저의 스킬 정보를 가져온다(스킬 전체 정보를 가지고 있다)
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
    // maxHp를 초과하지 않도록 제한
    this.stat.hp = Math.min(this.stat.hp + hp, this.stat.maxHp);

    // maxMp를 초과하지 않도록 제한
    this.stat.mp = Math.min(this.stat.mp + mp, this.stat.maxMp);
  }

  resetHpMp() {
    this.stat.hp = this.stat.maxHp;
    this.stat.mp = this.stat.maxMp;
  }

  async reduceGold(gold) {
    this.gold -= gold;

    // DB에 감소한 재화 저장
    await updateUserResource(this.nickname, this.gold, this.stone);
  }

  async increaseResource(gold, stone) {
    this.gold += gold;
    this.stone += stone;

    // DB에 증가한 재화 저장
    await updateUserResource(this.nickname, this.gold, this.stone);
  }
}

export default User;
