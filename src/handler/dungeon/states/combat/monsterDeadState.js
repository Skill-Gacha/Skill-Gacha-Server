// src/handler/dungeon/states/monsterDeadState.js

import DungeonState from '../base/dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import RewardState from '../result/rewardState.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';

const DEATH_ANIMATION_CODE = 4;

export default class MonsterDeadState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.MONSTER_DEAD;
    const deadMonsters = this.getDeadMonsters();

    deadMonsters.forEach((monster) => {
      this.sendMonsterDeathAnimation(monster);
      monster.isDead = true;
    });

    const aliveMonstersCount = this.getAliveMonstersCount();

    if (aliveMonstersCount === 0) {
      // 모든 몬스터가 사망한 경우 클리어이므로 보상 상태로 전환
      await this.changeState(RewardState);
    } else {
      // 아직 살아있는 몬스터가 있으면 적 공격 상태로 전환
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

  sendMonsterDeathAnimation(monster) {
    this.socket.write(
      createResponse(PacketType.S_MonsterAction, {
        actionMonsterIdx: monster.monsterIdx,
        actionSet: {
          animCode: DEATH_ANIMATION_CODE,
        },
      }),
    );
  }
}
