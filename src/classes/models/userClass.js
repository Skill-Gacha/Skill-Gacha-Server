// src/classes/models/UserClass.js

import Stat from './StatClass.js';
import Position from './PositionClass.js';

class User {
  constructor(socket, id, nickname, job) {
    this.socket = socket;
    this.id = id;
    this.nickname = nickname;
    this.job = job;

    // 위치 정보
    this.position = new Position();

    // 스탯 정보
    this.stat = new Stat();

    // 인벤토리 (아이템 리스트)
    this.inventory = [];

    // 플레이어 정보 (프로토콜용)
    this.playerInfo = {
      playerId: this.id,
      nickname: this.nickname,
      job: this.job,
      transform: this.position,
      statInfo: this.stat,
    };
  }

  updateHp(amount) {
    this.stat.updateHp(amount);
  }

  updateMp(amount) {
    this.stat.updateMp(amount);
  }

  addItem(item) {
    this.inventory.push(item);
  }

  getItemByIndex(index) {
    return this.inventory[index];
  }
}

export default User;
