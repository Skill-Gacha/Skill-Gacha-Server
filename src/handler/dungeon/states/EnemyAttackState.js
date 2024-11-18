// src/handlers/dungeon/states/EnemyAttackState.js

import DungeonState from './DungeonState.js';
import ActionState from './ActionState.js';
import GameOverLoseState from './GameOverLoseState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';

export default class EnemyAttackState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = 'ENEMY_ATTACK';
    const aliveMonsters = this.dungeon.monsters.filter((monster) => monster.monsterHp > 0);

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
            btns: [],
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
