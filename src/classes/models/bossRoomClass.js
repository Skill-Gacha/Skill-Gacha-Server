// src/classes/models/bossRoomClass.js

import BaseSession from './baseSession.js';
import { getGameAssets } from '../init/loadAssets.js';
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

    // 몬스터 데이터 로드
    this.monsterData = getGameAssets().MonsterData.data; 
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

  // 보스 몬스터 추가
  setBoss() {
    const boss = this.monsterData.find(monster => monster.monsterModel === 2029); // 보스 몬스터
    if (boss) this.addMonster(boss); // 보스 몬스터 추가
  }

  // 쫄 몬스터 랜덤 생성
  spawnMinions() {
    // 현재 페이즈가 2일 때만 쫄 몬스터를 생성
    if (this.phase === 2) {
      const minionModels = [2025, 2026, 2027, 2028]; // 쫄 몬스터 모델
      const numMinions = 2; // 항상 2마리 생성
      const selectedMinions = []; // 선택된 쫄 몬스터 모델을 저장할 배열
  
      for (let i = 0; i < numMinions; i++) {
        // 랜덤 인덱스 생성
        const randomIndex = Math.floor(Math.random() * minionModels.length);
        const minionModel = minionModels[randomIndex];
        selectedMinions.push(minionModel); // 선택된 모델 추가
      }
  
      // 선택된 모델로 쫄 몬스터 추가
      selectedMinions.forEach(model => {
        const minion = this.monsterData.find(monster => monster.monsterModel === model);
        if (minion) this.addMonster(minion); // 랜덤 쫄 추가
      });
    }
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
