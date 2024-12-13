// src/handler/dungeon/states/combat/monsterDeadState.js

import DungeonState from '../base/dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import RewardState from '../result/rewardState.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import { sendMonsterAction } from '../../../../utils/battle/dungeonHelpers.js';

const DEATH_ANIMATION_CODE = 4;

export default class MonsterDeadState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.MONSTER_DEAD;

    const deadMonsters = this.getDeadMonsters();
    deadMonsters.forEach((monster) => {
      sendMonsterAction(this.socket, monster.monsterIdx, { animCode: DEATH_ANIMATION_CODE });
      monster.isDead = true;
    });

    const aliveCount = this.getAliveMonstersCount();

    if (aliveCount === 0) {
      await this.changeState(RewardState);
    } else {
      this.changeState(EnemyAttackState);
    }
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }

  getDeadMonsters() {
    return this.dungeon.monsters.filter((m) => m.monsterHp <= 0 && !m.isDead);
  }

  getAliveMonstersCount() {
    return this.dungeon.monsters.filter((m) => m.monsterHp > 0).length;
  }
}
