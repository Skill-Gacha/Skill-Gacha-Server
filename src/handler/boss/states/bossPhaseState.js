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

    if (phase === 3) {
      this.createShield(boss);
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

  createShield(boss) {
    // 쉴드 생성 로직
    this.bossRoom.shieldAmount = 1000; // 쉴드 초기화
    const message = `${boss.monsterName}가 쉴드를 생성했습니다. 쉴드 양: ${this.shieldAmount}`;

    // 모든 플레이어에게 쉴드 생성 알리기
    this.sendBattleLog(message);

    for (const player of this.users) {
      this.sendBattleLog(player.socket, message);
    }
  }

  sendBattleLog(message) {
    this.users.forEach((user) => {
      user.socket.write(
        createResponse(PacketType.S_BossBattleLog, {
          battleLog: {
            msg: message,
            typingAnimation: false,
            btns: DISABLE_BUTTONS,
          },
        }),
      );
    });
  }

  async handleInput(responseCode) {
    invalidResponseCode(responseCode);
  }
}
