// src/handler/boss/states/bossPhaseState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossRoomState from './bossRoomState.js';
import { ELEMENT_KEYS, RESISTANCE_KEYS } from '../../../utils/battle/calculate.js';
import { getElementById } from '../../../init/loadAssets.js';
import { elementResist } from '../../../utils/packet/playerPacket.js';

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
    console.log('asdf', randomElement);

    this.setBossResistances(boss, randomElement, phase);
    this.users.forEach((user) => {
      user.socket.write(createResponse(PacketType.S_BossPhase, { randomElement, phase }));
    });

    if (phase === 3 && !this.bossRoom.shieldActivated) {
      this.createShield(boss);
      this.bossRoom.shieldActivated = true; // 쉴드가 생성되었음을 기록
    }
  }

  // 보스의 속성을 무작위로 변경하는 메서드
  bossRandomElement() {
    return Math.floor(
      Math.random() * (MAX_ELEMENT_CODE_OFFSET - MIN_ELEMENT_CODE_OFFSET) + MIN_ELEMENT_CODE_OFFSET,
    );
  }

  // 보스 저항 설정 메서드
  setBossResistances(boss, randomElement, phase) {
    const chosenElement = getElementById(randomElement);
    if (!chosenElement) {
      console.error('bossPhaseState: 존재하지 않는 속성 ID입니다.');
      return;
    }
    if (phase === 2) {
      boss.resistances = elementResist(chosenElement);
      console.log('보스속성 2페:', boss.resistances);
    } else if (phase === 3) {
      const previousElement = this.bossRoom.previousElement;

      if (previousElement === randomElement) {
        randomElement = this.bossRandomElement();
      }
      boss.resistances = elementResist(chosenElement);
      console.log('보스속성 3페:', boss.resistances);
    }
  }

  createShield(boss) {
    const message = `${boss.monsterName}가 쉴드를 생성했습니다. 쉴드가 ${this.bossRoom.shieldCount}회 공격을 막습니다.`;

    // 모든 플레이어에게 쉴드 생성 알리기
    this.sendBattleLog(message);

    for (const player of this.users) {
      this.sendBattleLog(message, player.socket);
    }
  }

  sendBattleLog(message, socket = null) {
    if (typeof message !== 'string') {
      console.error('전송할 메시지가 문자열이 아닙니다:', message);
      return; // 문자열이 아닐 경우 처리 중단
    }

    // 모든 사용자에게 메시지를 전송
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

  async handleInput(responseCode) {
    invalidResponseCode(responseCode);
  }
}
