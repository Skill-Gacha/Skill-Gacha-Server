// src/handler/pvp/states/pvpSkillChoiceState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import PvpState from './pvpState.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import PvpPlayerAttackState from './pvpPlayerAttackState.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpTurnChangeState from './pvpTurnChangeState.js';

export default class PvpSkillChoice extends PvpState {
  enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.SKILL_CHOICE;

    const buttons = this.mover.userSkills.map((skill, index) => ({
      msg: `${skill.skillName}(데미지 ${skill.damage} / 마나 ${skill.mana})`,
      enable: this.mover.stat.mp >= skill.mana,
    }));

    buttons.push({ msg: '턴 넘기기', enable: true });

    const battleLog = {
      msg: '스킬을 선택하여 상대방을 공격하세요',
      typingAnimation: false,
      btns: buttons,
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));
  }

  async handleInput(responseCode) {
    if (responseCode < 1 || responseCode > this.mover.userSkills.length + 1) {
      invalidResponseCode(this.mover.socket);
      return;
    }

    if (responseCode === this.mover.userSkills.length + 1) {
      this.changeState(PvpTurnChangeState);
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
