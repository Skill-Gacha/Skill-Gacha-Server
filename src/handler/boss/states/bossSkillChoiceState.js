// src/handler/boss/states/bossSkillChoiceState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { AREASKILL, BOSS_STATUS, MAX_BUTTON_COUNT } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import BossActionState from './bossActionState.js';
import BossPlayerAttackState from './bossPlayerAttackState.js';
import BossTargetState from './bossTargetState.js';

// 스킬 선택 상태
export default class BossSkillChoiceState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.SKILL_CHOICE;

    // 버튼은 플레이어가 보유한 스킬들로 생성
    const buttons = this.user.userSkills.map((skill) => ({
      msg: `${skill.skillName}(데미지 ${skill.damage} / 마나 ${skill.mana})`,
      enable: this.user.stat.mp >= skill.mana,
    }));

    buttons.push({
      msg: '뒤로 가기',
      enable: true,
    });

    // 스킬 로그 데이터
    const battleLog = {
      msg: '스킬을 선택하여 몬스터를 공격하세요',
      typingAnimation: false,
      btns: buttons,
    };

    const choiceSkillBattlelogResponse = createResponse(PacketType.S_BattleLog, { battleLog });
    this.user.socket.write(choiceSkillBattlelogResponse);
  }

  async handleInput(responseCode) {
    // responseCode 유효성 검사)
    if (responseCode < 1 || responseCode > MAX_BUTTON_COUNT) {
      invalidResponseCode(this.socket);
    }

    if (responseCode > this.user.userSkills.length) {
      this.changeState(BossActionState);
    } else {
      // 선택한 스킬 인덱스 계산
      const SkillIdx = responseCode - 1;
      this.bossRoom.selectedSkill = SkillIdx;
      const userSkillInfo = this.user.userSkills[SkillIdx];
      if (userSkillInfo.id >= AREASKILL) {
        this.changeState(BossPlayerAttackState);
        return;
      }

      // 스킬 선택 후 타겟 지정
      this.changeState(BossTargetState);
    }
  }
}
