// src/handler/pvp/states/pvpSkillChoiceState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import PvpState from './pvpState.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import PvpPlayerAttackState from './pvpPlayerAttackState.js';
import { MAX_SKILL_COUNT, PVP_STATUS } from '../../../constants/battle.js';

export default class PvpSkillChoice extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.SKILL_CHOICE;
    // 버튼은 플레이어가 보유한 스킬들로 생성
    const buttons = this.mover.userSkills.map((skill) => ({
      msg: `${skill.skillName}(데미지 ${skill.damage} / 마나 ${skill.mana})`,
      enable: this.mover.stat.mp >= skill.mana,
    }));

    //스킬 로그 데이터
    const battleLog = {
      msg: '스킬을 선택하여 상대방을 공격하세요',
      typingAnimation: false,
      btns: buttons,
    };

    const choiceSkillBattlelogResponse = createResponse(PacketType.S_PvpBattleLog, {
      battleLog,
    });
    this.mover.socket.write(choiceSkillBattlelogResponse);
  }

  async handleInput(responseCode) {
    // responseCode 유효성 검사)
    if (responseCode < 1 || responseCode > MAX_SKILL_COUNT) {
      invalidResponseCode(this.mover.socket);
    }

    // 선택한 스킬 인덱스 계산
    const SkillIdx = responseCode - 1;
    this.pvpRoom.selectedSkill = SkillIdx;

    // 스킬 선택 후 플레이어 어택 상태로 전환
    this.changeState(PvpPlayerAttackState);
  }
}
