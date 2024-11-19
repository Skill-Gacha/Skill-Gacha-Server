// src/handler/dungeon/states/monsterDeadState.js

import DungeonState from './dungeonState.js';
import GameOverWinState from './gameOverWinState.js';

// 보상 처리
export default class RewardState extends DungeonState {
  async enter() {
    const reward = this.dungeon.reward;
    this.changeState(GameOverWinState);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
