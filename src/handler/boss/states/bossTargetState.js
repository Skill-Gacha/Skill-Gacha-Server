// src/handler/boss/states/bossTargetState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';


// 공격할 대상을 선택하기 위한 버튼 목록 생성
export default class BossTargetState extends BossRoomState {
  async enter() {

     // 보스룸 인스턴스 생성 및 몬스터 추가
    if (!this.bossRoom) {
      this.bossRoom = new BossRoomClass(this.bossRoom.id); // 보스룸 생성
      this.bossRoom.setBoss(); //보스
      this.bossRoom.spawnMinions(); //쫄생성
    }
    
    this.bossRoom.bossStatus = BOSS_STATUS.TARGET;
    const buttons = this.createTargetButtons();

    const battleLog = {
      msg: '공격할 대상을 선택해주세요.',
      typingAnimation: false,
      btns: buttons,
    };

    this.socket.write(createResponse(PacketType.S_BossBattleLog, { battleLog }));
  }

  createTargetButtons() {
    return this.bossRoom.monsters.map((monster) => ({
      msg: monster.monsterName,
      enable: monster.monsterHp > 0,
    }));
  }

  async handleInput(responseCode) {
    const targetIndex = responseCode;
    const allTargets = this.bossRoom.monsters; // 몬스터 배열

    if (targetIndex < 0 || targetIndex >= allTargets.length) {
      return this.invalidTargetResponse(targetIndex);
    }

    const target = allTargets[targetIndex];
    if (target && target.monsterHp > 0) {
      this.bossRoom.selectedMonster = target;
      this.changeState(PlayerAttackState); // 공격 상태로 전환
    } else {
      this.invalidTargetResponse(targetIndex);
    }
  }

  invalidTargetResponse(targetIndex) {
    let message = '유효하지 않은 선택입니다. 다시 선택해주세요.';
    
    // 인덱스 범위 초과 확인
    const totalTargets = this.bossRoom.monsters.length;
    if (targetIndex < 0 || targetIndex >= totalTargets) {
      message = '선택한 인덱스가 유효하지 않습니다. 다시 선택해주세요.';
    } else {
      const target = this.bossRoom.monsters[targetIndex];
      if (target.monsterHp === 0) {
        message = `${target.monsterName}은(는) 이미 처치되었습니다. 다른 대상을 선택해주세요.`;
      }
    }

    const response = createResponse(PacketType.S_BossBattleLog, {
      msg: message,
      typingAnimation: false,
      btns: [],
    });

    this.socket.write(response);
  }
}