// src/classes/models/pvpRoomClass.js

import BaseSession from './baseSession.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PacketType } from '../../constants/header.js';
import { PVP_TURN_TIMEOUT_LIMIT } from '../../constants/battle.js';
import PvpIncreaseManaState from '../../handler/pvp/states/turn/pvpIncreaseManaState.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js'; // 위에서 만든 timerService import

const PLAYER_A = 0;
const PLAYER_B = 1;

class PvpRoomClass extends BaseSession {
  constructor(pvpId) {
    super(pvpId);
    this.currentState = null;
    this.pvpStatus = null;
    this.userTurn = null;
    this.selectedSkill = null;
    this.selectedItem = null;
    this.gameStart = false;

    this.timerMgr = serviceLocator.get(TimerManager);
    this.turnTimerId = null; // 타이머 식별자
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
    this.turnTimerId = this.timerMgr.requestTimer(PVP_TURN_TIMEOUT_LIMIT, () => {
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
    const players = Array.from(this.users.values());
    const currentPlayer = players[this.userTurn];
    if (!currentPlayer) {
      return;
    }
    const opponent = players[this.userTurn === PLAYER_A ? PLAYER_B : PLAYER_A];

    // 시간 초과 메시지 전송
    const timeoutMessage = createResponse(PacketType.S_PvpBattleLog, {
      msg: '시간 초과로 턴이 넘어갑니다.',
      typingAnimation: false,
      btns: [],
    });
    currentPlayer.socket.write(timeoutMessage);

    // `PvpIncreaseManaState`로 상태 전환하여 턴을 넘김
    this.currentState = new PvpIncreaseManaState(this, currentPlayer, opponent);
    this.currentState.enter();

    // 새로운 턴 타이머는 `PvpIncreaseManaState`에서 처리됨
  }
}

export default PvpRoomClass;
