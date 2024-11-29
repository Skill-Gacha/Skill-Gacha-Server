// src/classes/models/bossRoomClass.js

import BaseSession from './baseSession.js';

// 매칭 큐를 통해 게임이 잡힌 유저 2명의 대한 방
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

    // 전역 턴 타이머 추가
    this.turnTimer = null;
  }

  setUsers(playerA, playerB, playerC) {
    this.addUser(playerA);
    this.addUser(playerB);
    this.addUser(playerC);

    // 첫번째 유저가 첫번째 순서
    this.userTurn = playerA;
    this.gameStart = true;
  }

  getUsers() {
    return [...this.users.values()];
  }

  addMonster(monster) {
    this.monsters.push(monster);
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

export default BossRoomClass;
