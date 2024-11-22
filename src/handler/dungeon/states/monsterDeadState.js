// src/handler/dungeon/states/monsterDeadState.js

import DungeonState from './dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import rewardState from './rewardState.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

// 몬스터 사망 처리
export default class MonsterDeadState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.MONSTER_DEAD;
    const monster = this.dungeon.selectedMonster;

    // 몬스터 사망 애니메이션 전송
    this.socket.write(
      createResponse(PacketType.S_MonsterAction, {
        actionMonsterIdx: monster.monsterIdx,
        actionSet: {
          animCode: 4, // 사망 애니메이션 코드
        },
      }),
    );

    const aliveMonsters = this.dungeon.monsters.filter((m) => m.monsterHp > 0);

    if (aliveMonsters.length === 0) {
      this.changeState(rewardState);
    } else {
      this.changeState(EnemyAttackState);
    }
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
