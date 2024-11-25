// src/classes/models/userClass.js

import Position from './positionClass.js';
import Stat from './statClass.js';
import { updateUserResource } from '../../db/user/user.db.js';
import { getItemsFromRedis, updateItemCountInRedis } from '../../db/redis/itemService.js';

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

  async updateItem(nickname) {
    this.items = await getItemsFromRedis(nickname);
  }

  getInventory() {
    return {
        gold: this.gold,
        stone: this.stone,
        productList: this.items.map(item => ({
          id: item.itemId,
          count: item.count,
        })),
      };
  }
}

export default User;
