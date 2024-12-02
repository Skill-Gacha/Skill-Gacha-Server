// src/handler/boss/states/bossPhaseState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossRoomState from './bossRoomState.js';
import { RESISTANCE_KEYS } from '../../../utils/battle/calculate.js';
import BossTurnChangeState from './bossTurnChangeState.js';

const DISABLE_BUTTONS = [{ msg: '보스가 공격 중', enable: false }];

export default class BossPhaseState extends BossRoomState {
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.BOSS_PHASE_CHANGE;

    const phase = this.bossRoom.phase;
    const boss = this.bossRoom.monsters.find((monster) => monster.monsterModel === 2029);

    this.setBossResistances(boss, phase);

    const randomElement = this.bossRoom.element;
    this.user.socket.write(
      createResponse(PacketType.S_BossPhase, {
        randomElement,
        phase,
        monsterIdx: this.bossRoom.monsters.slice(1).map((monster) => ({
          monsterIdx: monster.monsterIdx,
          hp: monster.monsterHp,
        })),
      }),
    );

    if (phase === 1) {
      await this.bossAreaAttack(this.bossRoom.getUsers(), boss);
    } else if (phase === 3) {
      await this.bossThirdPhaseAction(this.bossRoom.getUsers(), boss);
    }
    this.changeState(BossTurnChangeState);
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

  async bossThirdPhaseAction(boss) {
    // 쉴드가 남아있는 경우
    if (this.shieldAmount > 0) {
      const message = `${boss.monsterName}의 쉴드가 ${this.shieldAmount} 만큼 남아있습니다.`;
      this.sendBattleLog(this.user.socket, message);

      // 모든 플레이어에게 쉴드 상태 알리기
      for (const player of this.users) {
        this.sendBattleLog(player.socket, message);
      }
      return;
    }

    // 쉴드가 0이 되면 HP 감소
    const damage = Math.floor(boss.monsterHp * 0.1);
    let damageToShield = Math.min(damage, this.shieldAmount);
    this.shieldAmount -= damageToShield;

    let remainingDamage = damage - damageToShield;
    if (this.shieldAmount <= 0) {
      remainingDamage += Math.abs(this.shieldAmount);
      this.shieldAmount = 0;
    }

    boss.monsterHp -= remainingDamage;

    this.user.socket.write(
      createResponse(PacketType.S_BossSetMonsterHp, {
        hp: boss.monsterHp,
      }),
    );
  }

  sendPlayerStatus() {
    const playerIds = this.users.map((u) => u.id);
    const hps = this.users.map((u) => u.stat.hp);
    const mps = this.users.map((u) => u.stat.mp);

    this.users.forEach((u) => {
      u.socket.write(
        createResponse(PacketType.S_BossPlayerStatusNotification, {
          playerId: playerIds,
          hp: hps,
          mp: mps,
        }),
      );
    });
  }

  async handleInput(responseCode) {
    invalidResponseCode(responseCode);
  }
}
