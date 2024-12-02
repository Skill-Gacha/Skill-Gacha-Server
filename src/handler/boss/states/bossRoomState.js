// src/handler/boss/states/bossRoomState.js

import Monster from '../../../classes/models/monsterClass.js';
import GameState from '../../states/gameState.js';

const bossShield = 1000;
const minionModels = [2025, 2026, 2027, 2028];

export default class BossRoomState extends GameState {
  constructor(session, user, socket) {
    super(session, user, socket);
    this.bossRoom = session;
    this.user = this.bossRoom.userTurn;
    this.users = this.bossRoom.getUsers();
    this.element = null; //보스의 속성
    this.shieldAmount = 1000; // 쉴드
  }
}
