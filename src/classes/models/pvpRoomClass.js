// src/classes/models/pvpRoomClass.js

import BaseSession from './baseSession.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PacketType } from '../../constants/header.js';
import PvpIncreaseManaState from '../../handler/pvp/states/pvpIncreaseManaState.js';
import { PVP_TURN_TIMEOUT_LIMIT } from '../../constants/battle.js';

const PLAYER_A = 0;
const PLAYER_B = 1;

// 매칭 큐를 통해 게임이 잡힌 유저 2명의 대한 방
class PvpRoomClass extends BaseSession {
  constructor(pvpId) {
    super(pvpId);
    this.currentState = null;
    this.pvpStatus = null;
    this.userTurn = null;
    this.selectedSkill = null;
    this.selectedItem = null;
    this.gameStart = false;

    // 전역 턴 타이머 추가
    this.turnTimer = null;
  }

  initializeTurn() {
    this.userTurn = Math.random() > 0.5 ? PLAYER_A : PLAYER_B;
  }

  switchTurn() {
    this.userTurn = this.userTurn === PLAYER_A ? PLAYER_B : PLAYER_A;
  }

  getUserTurn() {
    return this.userTurn;
  }

  // 턴 타이머 시작
  startTurnTimer() {
    this.clearTurnTimer(); // 기존 타이머가 있으면 취소
    this.turnTimer = setTimeout(() => {
      this.onTurnTimeout();
    }, PVP_TURN_TIMEOUT_LIMIT);
  }

  // 턴 타이머 취소
  clearTurnTimer() {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
  }

  // 턴 타임아웃 처리
  onTurnTimeout() {
    const players = Array.from(this.users.values());
    const currentPlayer = players[this.userTurn];
    const opponent = players[this.userTurn === PLAYER_A ? PLAYER_B : PLAYER_A];

    // 시간 초과 메시지 전송
    const timeoutMessage = createResponse(PacketType.S_PvpBattleLog, {
      msg: '시간 초과로 턴이 넘어갑니다.',
      typingAnimation: false,
      btns: [],
    });
    currentPlayer.socket.write(timeoutMessage);

    // `PvpIncreaseManaState`로 상태 전환하여 턴을 넘김
    this.currentState = new PvpIncreaseManaState(this, opponent, currentPlayer);
    this.currentState.enter();

    // 새로운 턴 타이머는 `PvpIncreaseManaState`에서 처리됨
  }
}

export default PvpRoomClass;
