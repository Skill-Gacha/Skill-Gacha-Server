// src/handler/dungeon/battleFlows/entityDeadState.js

import {
  STATE_GAME_OVER_WIN,
  STATE_GAME_OVER_LOSE, PVP_MODE, PVE_MODE, STATE_OPPONENT_ATTACK,
} from '../../../constants/constants.js';
import gameOverWinState from './gameOverWinState.js';
import gameOverLoseState from './gameOverLoseState.js';
import opponentAttackState from './opponentAttackState.js';

const entityDeadState = (responseCode, dungeon, user) => {
  console.log('entityDeadState Called');

  if (dungeon.mode === PVE_MODE) {
    const monstersAlive = dungeon.monsters.some((monster) => monster.stat.hp > 0);

    if (!monstersAlive) {
      dungeon.currentBattleState = STATE_GAME_OVER_WIN;
      gameOverWinState(responseCode, dungeon, user);
    } else if (user.stat.hp <= 0) {
      dungeon.currentBattleState = STATE_GAME_OVER_LOSE;
      gameOverLoseState(responseCode, dungeon, user);
    } else {
      // 다음 몬스터를 선택하거나 플레이어의 턴으로 전환
      dungeon.currentBattleState = STATE_OPPONENT_ATTACK;
      opponentAttackState(responseCode, dungeon, user);
    }
  }
  else if (dungeon.mode === PVP_MODE) {
    // PVP 로직 구현
  }
};

export default entityDeadState;
