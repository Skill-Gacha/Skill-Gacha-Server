// src/handler/pvp/states/pvpSkillChoiceState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import PvpState from './pvpState.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import PvpPlayerAttackState from './pvpPlayerAttackState.js';
import { MAX_BUTTON_COUNT, PVP_STATUS } from '../../../constants/battle.js';
import PvpActionState from './pvpActionState.js';

export default class PvpSkillChoice extends PvpState {
  enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.SKILL_CHOICE;

    const buttons = this.mover.userSkills.map((skill, index) => ({
      msg: `${skill.skillName}(데미지 ${skill.damage} / 마나 ${skill.mana})`,
      enable: this.mover.stat.mp >= skill.mana,
    }));

    buttons.push({ msg: '뒤로 가기', enable: true });

    const battleLog = {
      msg: '스킬을 선택하여 상대방을 공격하세요',
      typingAnimation: false,
      btns: buttons,
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));
  }

  async handleInput(responseCode) {
    // responseCode 유효성 검사)
    if (responseCode < 1 || responseCode > MAX_BUTTON_COUNT) {
      invalidResponseCode(this.mover.socket);
      return;
    }

    if (responseCode === this.mover.userSkills.length + 1) {
      this.changeState(PvpActionState);
    } else {
      const skillIndex = responseCode - 1;
      const selectedSkill = this.mover.userSkills[skillIndex];

      if (this.mover.stat.mp < selectedSkill.mana) {
        return;
      }

      this.pvpRoom.selectedSkill = skillIndex;
      this.changeState(PvpPlayerAttackState);
    }
  }
}
