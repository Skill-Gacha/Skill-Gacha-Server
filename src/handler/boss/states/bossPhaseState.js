// src/handler/boss/states/bossPhaseState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossRoomState from './bossRoomState.js';
import BossPlayerAttackState from './bossPlayerAttackState.js';
import { RESISTANCE_KEYS } from '../../../utils/battle/calculate.js';

const DISABLE_BUTTONS = [{ msg: '보스가 공격 중', enable: false }];

export default class BossPhaseState extends BossRoomState {
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.BOSS_PHASE_CHANGE;

    const phase = this.bossRoom.phase;
    const boss = this.bossRoom.monsters.find((monster) => monster.monsterModel === 2029);

    this.setBossResistances(boss, phase);

    const randomElement = this.bossRoom.element;
    this.socket.write(
      createResponse(PacketType.S_BossPhase, {
        randomElement,
        phase,
        monsterIdx: this.bossRoom.monsters.map((monster) => ({
          monsterIdx: monster.monsterIdx,
          hp: monster.monsterHp,
        })),
      }),
    );

    if (phase === 1) {
      await this.bossAreaAttack(this.bossRoom.getUsers(), boss);
    } else if (phase === 2) {
      if (!this.bossRoom.minionsSpawned) {
        this.bossRoom.spawnMinions();
      }
      await this.attackMinions(this.bossRoom.getUsers());
    } else if (phase === 3) {
      await this.bossThirdPhaseAction(this.bossRoom.getUsers(), boss);
    }

    this.changeState(BossPlayerAttackState);
  }

  setBossResistances(boss, phase) {
    const resistanceKeys = Object.keys(RESISTANCE_KEYS);
    let selectedResistanceKey;

    if (phase === 2) {
      const randomIndex = Math.floor(Math.random() * resistanceKeys.length);
      selectedResistanceKey = resistanceKeys[randomIndex];
      this.bossRoom.setBossElement(randomIndex + 1);
      boss.resistance = selectedResistanceKey;
    } else if (phase === 3) {
      const previousResistance = this.bossRoom.previousResistance;
      const filteredResistanceKeys = resistanceKeys.filter((key) => key !== previousResistance);
      const randomIndex = Math.floor(Math.random() * filteredResistanceKeys.length);
      selectedResistanceKey = filteredResistanceKeys[randomIndex];
      this.bossRoom.setBossElement(randomIndex + 1);
      boss.resistance = selectedResistanceKey;
    }

    if (selectedResistanceKey) {
      this.bossRoom.previousResistance = selectedResistanceKey;
    }
  }

  async bossThirdPhaseAction(players, boss) {
    // 쉴드가 남아있는 경우
    if (this.shieldAmount > 0) {
      this.socket.write(
        createResponse(PacketType.S_BossBattleLog, {
          battleLog: {
            msg: `${boss.monsterName}의 쉴드가 ${this.shieldAmount} 만큼 남아있습니다.`,
            typingAnimation: false,
            btns: DISABLE_BUTTONS,
          },
        }),
      );
      return;
    }

    // 쉴드가 0이 되면 HP 감소
    const damage = Math.floor(boss.hp * 0.1);
    let damageToShield = Math.min(damage, this.bossRoom.shieldAmount);
    this.shieldAmount -= damageToShield;

    let remainingDamage = damage - damageToShield;
    if (this.bossRoom.shieldAmount <= 0) {
      remainingDamage += Math.abs(this.bossRoom.shieldAmount);
      this.shieldAmount = 0;
    }

    boss.hp -= remainingDamage;

    this.socket.write(
      createResponse(PacketType.S_BossSetMonsterHp, {
        hp: boss.hp,
      }),
    );
  }

  async handleInput(responseCode) {
    invalidResponseCode(responseCode);
  }
}
