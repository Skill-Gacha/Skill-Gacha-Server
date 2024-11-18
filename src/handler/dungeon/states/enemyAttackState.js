﻿// src/handler/dungeon/states/enemyAttackState.js

import DungeonState from './dungeonState.js';
import ActionState from './actionState.js';
import GameOverLoseState from './gameOverLoseState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

export default class EnemyAttackState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.ENEMY_ATTACK;
    const aliveMonsters = this.dungeon.monsters.filter((monster) => monster.monsterHp > 0);

    // 몬스터가 플레이어 공격 시 의도되지 않은 조작 방지 위한 버튼 비활성화
    const buttons = this.dungeon.monsters.map((monster) => ({
      msg: monster.monsterName,
      enable: false,
    }));

    for (const monster of aliveMonsters) {
      const damage = monster.monsterAtk;
      this.user.reduceHp(damage);

      // 플레이어 HP 업데이트
      this.socket.write(
        createResponse(PacketType.S_SetPlayerHp, {
          hp: this.user.stat.hp,
        }),
      );

      // 몬스터 공격 애니메이션 전송
      this.socket.write(
        createResponse(PacketType.S_MonsterAction, {
          actionMonsterIdx: monster.monsterIdx,
          actionSet: {
            animCode: 0,
            effectCode: monster.effectCode,
          },
        }),
      );

      // 공격 결과 메시지 전송
      this.socket.write(
        createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: `${monster.monsterName}이(가) 당신을 공격하여 ${damage}의 피해를 입었습니다.`,
            typingAnimation: false,
            btns: buttons,
          },
        }),
      );

      // 플레이어 사망 여부 확인
      if (this.user.stat.hp <= 0) {
        this.changeState(GameOverLoseState);
        return;
      }

      // 공격 간 딜레이
      await delay(1000);
    }

    // 행동 선택 상태로 전환
    this.changeState(ActionState);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
