// src/handler/boss/states/phase/bossPhaseState.js

import { BOSS_STATUS } from '../../../../constants/battle.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import BossRoomState from '../base/bossRoomState.js';
import { getElementById } from '../../../../init/loadAssets.js';
import { elementResist } from '../../../../utils/packet/playerPacket.js';

const DISABLE_BUTTONS = [{ msg: '보스가 공격 중', enable: false }];
const BOSS_MONSTER_MODEL = 2029;
const MIN_ELEMENT_CODE_OFFSET = 1001;
const MAX_ELEMENT_CODE_OFFSET = 1005;

export default class BossPhaseState extends BossRoomState {
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.BOSS_PHASE_CHANGE;

    const boss = this.bossRoom.monsters.find(
      (monster) => monster.monsterModel === BOSS_MONSTER_MODEL,
    );

    const phase = this.bossRoom.phase;
    const randomElement = this.bossRandomElement();
    this.bossRoom.previousElement = randomElement; // 보스 속성 부여

    this.setBossResistances(boss, randomElement, phase);
    this.users.forEach((user) => {
      user.socket.write(createResponse(PacketType.S_BossPhase, { randomElement, phase }));
    });

    if (phase === 3 && !this.bossRoom.shieldActivated) {
      this.createShield(boss);
      this.bossRoom.shieldActivated = true; // 쉴드 생성 표시
    }
  }

  bossRandomElement() {
    return Math.floor(
      Math.random() * (MAX_ELEMENT_CODE_OFFSET - MIN_ELEMENT_CODE_OFFSET) + MIN_ELEMENT_CODE_OFFSET,
    );
  }

  setBossResistances(boss, randomElement, phase) {
    const chosenElement = getElementById(randomElement);
    if (!chosenElement) {
      console.error('bossPhaseState: 존재하지 않는 속성 ID입니다.');
      return;
    }

    if (phase === 2) {
      boss.resistances = elementResist(chosenElement);
      this.bossRoom.previousElement = randomElement;
    } else if (phase === 3) {
      const previousElement = this.bossRoom.previousElement;

      if (previousElement === randomElement) {
        // 이전 속성과 동일하면 다시 랜덤
        randomElement = this.bossRandomElement();
      }
      boss.resistances = elementResist(chosenElement);
    }
  }

  createShield(boss) {
    const message = `${boss.monsterName}가 쉴드를 생성했습니다. 쉴드가 ${this.bossRoom.shieldCount}회 공격을 막습니다.`;

    this.sendBattleLog(message);
    for (const player of this.users) {
      this.sendBattleLog(message, player.socket);
    }
  }

  sendBattleLog(message, socket = null) {
    if (typeof message !== 'string') {
      console.error('전송할 메시지가 문자열이 아닙니다:', message);
      return;
    }

    if (socket) {
      socket.write(
        createResponse(PacketType.S_BossBattleLog, {
          battleLog: {
            msg: message,
            typingAnimation: false,
            btns: DISABLE_BUTTONS,
          },
        }),
      );
    } else {
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
  }

  async handleInput(responseCode) {}
}