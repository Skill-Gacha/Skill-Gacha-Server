// src/handler/dungeon/states/combat/enemyAttackState.js

import DungeonState from '../base/dungeonState.js';
import { delay } from '../../../../utils/delay.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import IncreaseManaState from '../turn/increaseManaState.js';
import PlayerDeadState from './playerDeadState.js';
import { sendBattleLog, sendMonsterAction, sendPlayerHpMp } from '../../../../utils/battle/dungeonHelpers.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';

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
            actionSet: { animCode: DEATH_ANIMATION_CODE },
          }),
        );
        this.changeState(PlayerDeadState);
        return;
      }

      await delay(ATTACK_DELAY);
    }

    this.user.stat.protect = false;
    this.changeState(IncreaseManaState);
  }

  async monsterAttackPlayer(monster) {
    let damage = monster.monsterAtk;
    if (this.user.stat.protect) {
      damage = 1;
    }

    this.user.reduceHp(damage);
    sendPlayerHpMp(this.socket, this.user);

    sendMonsterAction(this.socket, monster.monsterIdx, {
      animCode: ATTACK_ANIMATION_CODE,
      effectCode: monster.effectCode,
    });

    sendBattleLog(this.socket, `${monster.monsterName}이(가) 당신을 공격하여 ${damage}의 피해를 입었습니다.`, DISABLE_BUTTONS);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
