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
  // 보스의 속성을 무작위로 초기화하는 메서드
  initializeElement() {
    const resistanceKeys = Object.keys(RESISTANCE_KEYS);
    const randomIndex = Math.floor(Math.random() * resistanceKeys.length);
    return resistanceKeys[randomIndex]; // 무작위 속성 반환
  }

  // 보스의 속성을 설정하는 메서드
  setBossElement(elementIndex) {
    const resistanceKeys = Object.keys(RESISTANCE_KEYS);
    this.element = resistanceKeys[elementIndex - 1]; // 보스의 속성 업데이트
  }

  // 보스 저항 설정 메서드
  setBossResistances(boss, phase) {
    const resistanceKeys = Object.keys(RESISTANCE_KEYS);
    let selectedResistanceKey;

    if (phase === 2) {
      const randomIndex = Math.floor(Math.random() * resistanceKeys.length);
      selectedResistanceKey = resistanceKeys[randomIndex];
      this.setBossElement(randomIndex + 1); // 페이즈 2에서 속성 설정
      boss.resistance = selectedResistanceKey;
    } else if (phase === 3) {
      const previousResistance = this.bossRoom.previousResistance;
      const filteredResistanceKeys = resistanceKeys.filter((key) => key !== previousResistance);
      const randomIndex = Math.floor(Math.random() * filteredResistanceKeys.length);
      selectedResistanceKey = filteredResistanceKeys[randomIndex];
      this.setBossElement(randomIndex + 1); // 페이즈 3에서 속성 설정
      boss.resistance = selectedResistanceKey;
    }

    if (selectedResistanceKey) {
      this.bossRoom.previousResistance = selectedResistanceKey; // 이전 저항 업데이트
    }
  }
  createShield(boss) {
    // 쉴드 생성 로직
    this.bossRoom.shieldAmount = 1000; // 쉴드 초기화
    const message = `${boss.monsterName}가 쉴드를 생성했습니다. 쉴드 양: ${this.bossRoom.shieldAmount}`;

    // 모든 플레이어에게 쉴드 생성 알리기
    this.sendBattleLog(message);

    for (const player of this.users) {
      // 각 플레이어에게 메시지를 전송하기 위해 sendBattleLog를 호출합니다.
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
