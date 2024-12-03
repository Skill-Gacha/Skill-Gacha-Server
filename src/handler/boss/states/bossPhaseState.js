// src/handler/boss/states/bossPhaseState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossRoomState from './bossRoomState.js';
import { ELEMENT_KEYS, RESISTANCE_KEYS } from '../../../utils/battle/calculate.js';
import BossTurnChangeState from './bossTurnChangeState.js';

const DISABLE_BUTTONS = [{ msg: '보스가 공격 중', enable: false }];
const BOSS_MONSTER_MODEL = 2029;

export default class BossPhaseState extends BossRoomState {
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.BOSS_PHASE_CHANGE;

    const boss = this.bossRoom.monsters.find(
      (monster) => monster.monsterModel === BOSS_MONSTER_MODEL,
    );
    const phase = this.bossRoom.phase;
    this.setBossResistances(boss, phase);

    const randomElement = this.randomElement();
    this.setBossElement(randomElement);

    this.users.forEach((user) => {
      user.socket.write(createResponse(PacketType.S_BossPhase, { randomElement, phase }));
    });

    console.log('랜덤 속성?: ', randomElement);
    console.log('페이즈?: ', phase);

    if (phase === 3 && !this.bossRoom.shieldCreated) {
      this.createShield(boss);
      this.bossRoom.shieldCreated = true; // 쉴드가 생성되었음을 기록
    }
    //this.changeState(BossTurnChangeState);
  }
  // 보스의 속성을 무작위로 변경하는 메서드
  randomElement() {
    const elementKeys = Object.keys(ELEMENT_KEYS);
    const randomIndex = Math.floor(Math.random() * elementKeys.length);
    return elementKeys[randomIndex]; // 무작위 속성 반환
  }

  // 보스의 속성을 설정하는 메서드
  setBossElement(elementcode) {
    const elementKeys = Object.keys(ELEMENT_KEYS);
    this.element = elementKeys[elementcode - 1]; // 보스의 속성 업데이트
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
    this.bossRoom.shield = { remainingHits: 5 }; // 쉴드 초기화
    const message = `${boss.monsterName}가 쉴드를 생성했습니다. 쉴드가 ${this.bossRoom.shield.remainingHits}회 공격을 막습니다.`;

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
