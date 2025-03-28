// src/classes/models/bossRoomClass.js

import {
  PHASE_ONE_TURN_TIMEOUT_LIMIT,
  PHASE_THREE_TURN_TIMEOUT_LIMIT,
  PHASE_TWO_TURN_TIMEOUT_LIMIT,
} from '../../constants/battle.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import BaseSession from './baseSession.js';
import BossTurnChangeState from '../../handler/boss/states/turn/bossTurnChangeState.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';

class BossRoomClass extends BaseSession {
  constructor(bossRoomId) {
    super(bossRoomId);
    this.monsters = [];
    this.currentState = null;
    this.bossStatus = null;
    this.userTurn = null;
    this.selectedSkill = null;
    this.selectedItem = null;
    this.gameStart = false;
    this.phase = 1;
    this.previousElement = null;
    this.shieldCount = 5;

    this.shieldActivated = false; // 쉴드가 생성되었는지 여부를 추적하는 플래그 추가

    this.timerMgr = serviceLocator.get(TimerManager);
    this.turnTimerId = null; // 타이머 식별자
  }

  setUsers(playerA, playerB, playerC) {
    this.addUser(playerA);
    this.addUser(playerB);
    this.addUser(playerC);
    this.userTurn = playerA;
  }

  getUsers() {
    return [...this.users.values()];
  }

  addMonster(monster) {
    this.monsters.push(monster);
  }

  removeUser(user) {
    this.users.delete(user.id);
  }

  // 턴 타이머 시작
  startTurnTimer() {
    this.clearTurnTimer(); // 기존 타이머가 있으면 취소

    let timeoutLimit;
    switch (this.phase) {
      case 1:
        timeoutLimit = PHASE_ONE_TURN_TIMEOUT_LIMIT;
        break;
      case 2:
        timeoutLimit = PHASE_TWO_TURN_TIMEOUT_LIMIT;
        break;
      case 3:
        timeoutLimit = PHASE_THREE_TURN_TIMEOUT_LIMIT;
        break;
      default:
        console.error(`${this.phase} : 현재 페이즈 값을 찾지 못합니다.`);
        timeoutLimit = PHASE_ONE_TURN_TIMEOUT_LIMIT; // 기본값 설정
    }

    // 타이머 매니저를 통해 타이머 설정
    this.turnTimerId = this.timerMgr.requestTimer(timeoutLimit, () => {
      this.onTurnTimeout();
    });
  }

  // 턴 타이머 취소
  clearTurnTimer() {
    if (this.turnTimerId) {
      this.timerMgr.cancelTimer(this.turnTimerId);
      this.turnTimerId = null;
    }
  }

  // 턴 타임아웃 처리
  onTurnTimeout() {
    const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];
    const players = Array.from(this.users.values());
    const currentPlayer = players.find((user) => this.userTurn.id === user.id);

    if (!currentPlayer) {
      return;
    }

    // 유저가 타임아웃 직전 행동하면 로그 쏘지 못하게 방지
    if (currentPlayer.turnOff) {
      return;
    }

    if (currentPlayer.completeTurn) {
      return;
    }

    const battleLog = {
      msg: '시간 초과로 턴이 넘어갑니다.',
      typingAnimation: false,
      btns: BUTTON_OPTIONS.map((msg) => ({ msg, enable: false })),
    };

    // 시간 초과 메시지 전송
    const timeoutMessage = createResponse(PacketType.S_BossBattleLog, { battleLog });
    currentPlayer.socket.write(timeoutMessage);
    currentPlayer.completeTurn = true;

    // `BossTurnChangeState`로 상태 전환하여 턴을 넘김
    this.currentState = new BossTurnChangeState(this, currentPlayer);
    this.currentState.enter();

    // 새로운 턴 타이머는 `BossTurnChangeState` 및 `BossTurnChangeState`에서 처리됨
  }
}

export default BossRoomClass;
