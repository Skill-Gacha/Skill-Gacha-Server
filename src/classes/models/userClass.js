// src/classes/models/userClass.js

import Position from './positionClass.js';
import Stat from './statClass.js';
import Item from '../Item/itemClass.js';

class User {
  constructor(socket, id, element, nickname, maxHp, maxMp, gold, stone, resists) {
    this.socket = socket;
    this.id = id;
    this.element = element;
    this.nickname = nickname;
    this.position = new Position(0, 0, 0, 0);
    this.stat = new Stat(maxHp, maxHp, maxMp, maxMp, resists);
    this.userSkills = [];
    this.gold = gold;
    this.stone = stone;
    this.turnOff = false;
    this.isDead = false;
    this.completeTurn = false;
  }

  initItemCount(items) {
    this.inventory = new Item(items);
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

  changeHpMp() {
    const temp = this.stat.hp;
    this.stat.hp = this.stat.mp;
    this.stat.mp = temp;
    this.stat.hp = Math.min(this.stat.hp, this.stat.maxHp);
    this.stat.mp = Math.min(this.stat.mp, this.stat.maxMp);
  }

  resetHpMp() {
    this.stat.hp = this.stat.maxHp;
    this.stat.mp = this.stat.maxMp;
  }

  // reduce, increase인데도 단순히 증감만 수행하는 것이 아니라,
  // DB 저장까지 겸하고 있어 클래스의 책임이 모호할 수 있음
  reduceResource(gold, stone) {
    this.gold = Math.max(0, this.gold - gold);
    this.stone = Math.max(0, this.stone - stone);
  }

  increaseResource(gold, stone) {
    this.gold += gold;
    this.stone += stone;
  }

  getInventory() {
    return {
      gold: this.gold,
      stone: this.stone,
      productList: this.inventory.map((item) => ({
        id: item.itemId,
        count: item.count,
      })),
    };
  }

  getAddMsg() {
    return this.turnOff ? '턴을 넘기셔서' : '턴이 돌아와서';
  }
}

export default User;
