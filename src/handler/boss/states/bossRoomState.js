// src/handler/boss/states/bossRoomState.js

import GameState from '../../states/gameState.js';

export default class BossRoomState extends GameState {
  constructor(session, user, socket) {
    super(session, user, socket);
    this.bossRoom = session;
    this.user = this.bossRoom.userTurn;
    this.users = this.bossRoom.getUsers();
    this.element = null; //보스의 속성
    this.shieldAmount = 1000; // 쉴드
    this.minionsSpawned = false; //한번만 소환하려고 추가
  }

  // 쫄 몬스터 랜덤 생성
  spawnMinions() {
    // 현재 페이즈가 2일 때만 쫄 몬스터를 생성
    if (this.phase === 2) {
      const minionModels = [2025, 2026, 2027, 2028]; // 쫄 몬스터 모델
      const numMinions = 2; // 항상 2마리 생성
      const selectedMinions = new Set(); // 선택된 쫄 몬스터 모델을 저장할 Set

      while (selectedMinions.size < numMinions) {
        // 랜덤 인덱스 생성
        const randomIndex = Math.floor(Math.random() * minionModels.length);
        const minionModel = minionModels[randomIndex];
        selectedMinions.add(minionModel); // 선택된 모델 추가
      }

      // 선택된 모델로 쫄 몬스터 추가
      for (let i = 1; i < selectedMinions.length; i++) {
        const model = selectedMinions[i];
        const minionData = this.monsterData.find((monster) => monster.monsterModel === model);
        if (minionData) {
          const minionInstance = new Monster(
            i,
            minionData.monsterModel,
            minionData.monsterName,
            minionData.monsterHp,
            minionData.monsterAtk,
            minionData.monsterEffectCode,
            minionData,
          );
          this.addMonster(minionInstance); // 랜덤 쫄 추가
        }
      }
      this.minionsSpawned = true;
    }
  }
}
