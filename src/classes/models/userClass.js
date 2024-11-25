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
    this.userSkills = [];
    this.items = [];
    this.gold = gold;
    this.stone = stone;
  }

  reduceHp(damage) {
    if (this.stat.hp < damage) {
      this.stat.hp = 0;
    } else {
      this.stat.hp -= damage;
    }
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

  discountItem(itemId) {
    const userItem = this.items.find((item) => item.itemId === itemId);
    userItem.count -= 1;
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
