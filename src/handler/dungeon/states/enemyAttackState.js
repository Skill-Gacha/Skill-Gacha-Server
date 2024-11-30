// src/handler/dungeon/states/enemyAttackState.js

import DungeonState from './dungeonState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import IncreaseManaState from './increaseManaState.js';
import PlayerDeadState from './playerDeadState.js';

const ATTACK_ANIMATION_CODE = 0;
const DEATH_ANIMATION_CODE = 1;
const ATTACK_DELAY = 1000;
const DISABLE_BUTTONS = [{ msg: '몬스터가 공격 중', enable: false }];

export default class EnemyAttackState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.ENEMY_ATTACK;
    const aliveMonsters = this.dungeon.monsters.filter((monster) => monster.monsterHp > 0);

    for (const monster of aliveMonsters) {
      await this.monsterAttackPlayer(monster);

      if (this.user.stat.hp <= 0) {
        this.socket.write(
          createResponse(PacketType.S_PlayerAction, {
            actionSet: {
              animCode: DEATH_ANIMATION_CODE,
            },
          }),
        );
        this.changeState(PlayerDeadState);
        return;
      }

      await delay(ATTACK_DELAY);
    }

    // 무적 버프 초기화
    this.user.stat.protect = false;

    // 다음 상태로 전환
    this.changeState(IncreaseManaState);
  }

  async monsterAttackPlayer(monster) {
    let damage = monster.monsterAtk;

    if (this.user.stat.protect) {
      damage = 1;
    }

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
          animCode: ATTACK_ANIMATION_CODE,
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
          btns: DISABLE_BUTTONS,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
