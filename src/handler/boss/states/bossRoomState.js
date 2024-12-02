// src/handler/boss/states/bossRoomState.js

import GameState from '../../states/gameState.js';

export default class BossRoomState extends GameState {
  constructor(session, user, socket) {
    super(session, user, socket);
    this.bossRoom = session;
    this.user = this.bossRoom.userTurn;
    this.users = this.bossRoom.getUsers();
    this.element = null; //보스의 속성
    this.shieldAmount = 0; // 쉴드
    this.minionsSpawned = false; //한번만 소환하려고 추가
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
      selectedMinions.forEach((model) => {
        const minion = this.monsterData.find((monster) => monster.monsterModel === model);
        if (minion) this.addMonster(minion); // 랜덤 쫄 추가
      });
    }
  }
}
