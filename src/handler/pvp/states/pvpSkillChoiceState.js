// src/handler/pvp/states/pvpSkillChoiceState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import PvpState from './pvpState.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import PvpPlayerAttackState from './pvpPlayerAttackState.js';
import PvpActionState from './pvpActionState.js';
import { PVP_STATUS } from '../../../constants/battle.js';

const BUTTON_BACK = '뒤로 가기';
const BUTTON_CONFIRM = '확인';

export default class PvpSkillChoiceState extends PvpState {
  enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.SKILL_CHOICE;

    const buttons = this.mover.userSkills.map((skill, index) => ({
      msg: `${skill.skillName}(데미지 ${skill.damage} / 마나 ${skill.mana})`,
      enable: this.mover.stat.mp >= skill.mana,
    }));

    buttons.push({ msg: BUTTON_BACK, enable: true });

    const battleLog = {
      msg: '스킬을 선택하여 상대방을 공격하세요',
      typingAnimation: false,
      btns: buttons,
    };

    const response = createResponse(PacketType.S_PvpBattleLog, { battleLog });
    this.mover.socket.write(response);
  }

  async handleInput(responseCode) {
    // responseCode 유효성 검사
    // 스킬이 무조건 최대 개수만큼 있다는 보장은 없음
    if (responseCode < 1 || responseCode > this.mover.userSkills.length + 1) {
      invalidResponseCode(this.mover.socket);
      return;
    }

    if (responseCode === this.mover.userSkills.length + 1) {
      this.changeState(PvpActionState);
      return;
    }

    const skillIndex = responseCode - 1;
    const selectedSkill = this.mover.userSkills[skillIndex];

    if (this.mover.stat.mp < selectedSkill.mana) {
      invalidResponseCode(this.mover.socket);
      return;
    }

    this.pvpRoom.selectedSkill = skillIndex;
    this.changeState(PvpPlayerAttackState);
  }
}
