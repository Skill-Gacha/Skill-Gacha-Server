﻿// src/handler/dungeon/states/monsterDeadState.js

import DungeonState from './dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import GameOverWinState from './gameOverWinState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';

// 몬스터 사망 처리
export default class MonsterDeadState extends DungeonState {
  async enter() {
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
      this.changeState(GameOverWinState);
    } else {
      this.changeState(EnemyAttackState);
    }
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}