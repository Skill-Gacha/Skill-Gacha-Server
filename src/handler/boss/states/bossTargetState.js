// src/handler/boss/states/bossTargetState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';

export default class BossTargetState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.TARGET;

    // 공격할 대상을 선택하기 위한 버튼 목록 생성
    const buttons = this.createTargetButtons();
    
    const battleLog = {
      msg: '공격할 대상을 선택해주세요.',
      typingAnimation: false,
      btns: buttons,
    };

    this.socket.write(createResponse(PacketType.S_BossBattleLog, { battleLog }));
  }

  createTargetButtons() {
    const monsters = this.bossRoom.monsters; // 보스룸의 몬스터 목록
    const buttons = [];

    // 몬스터 버튼 추가
    monsters.forEach((monster) => {
      buttons.push({
        msg: monster.monsterName,
        enable: monster.monsterHp > 0,
      });
    });

    // 쫄 버튼 추가 (2페이즈에서만)
    if (this.bossRoom.phase === 2) {
      monsters.forEach((minion) => {
        buttons.push({
          msg: minion.monsterName,
          enable: minion.monsterHp > 0,
        });
      });
    }

    return buttons;
  }

  async handleInput(responseCode) {
    const targetIndex = responseCode - 1; // 사용자가 선택한 인덱스
    const allTargets = [...this.bossRoom.monsters, ...this.bossRoom.minions]; // 몬스터와 쫄을 합친 배열

    const target = allTargets[targetIndex];
    if (target && target.monsterHp > 0) {
      this.bossRoom.selectedMonster = target;
      this.changeState(PlayerAttackState); // 공격 상태로 전환
    } else {
      // 유효하지 않은 응답 코드 처리
      // (예: 잘못된 인덱스, HP가 0인 경우)
      this.invalidTargetResponse();
    }
  }

  invalidTargetResponse() {
    const message = createResponse(PacketType.S_BossBattleLog, {
      msg: '유효하지 않은 선택입니다. 다시 선택해주세요.',
      typingAnimation: false,
      btns: [],
    });

    this.socket.write(message);
  }
}
