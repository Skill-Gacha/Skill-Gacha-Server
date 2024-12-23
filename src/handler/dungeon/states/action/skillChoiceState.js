// src/handler/dungeon/states/action/skillChoiceState.js

import DungeonState from '../base/dungeonState.js';
import { AREASKILL, DUNGEON_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import ActionState from './actionState.js';
import TargetState from './targetState.js';
import PlayerAttackState from '../combat/playerAttackState.js';
import { sendBattleLog } from '../../../../utils/battle/dungeonHelpers.js';

const BUTTON_BACK = '뒤로 가기';

export default class SkillChoiceState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.SKILL_CHOICE;

    const buttons = this.user.userSkills.map((skill) => ({
      msg: `${skill.skillName}(데미지 ${skill.damage} / 마나 ${skill.mana})`,
      enable: this.user.stat.mp >= skill.mana,
    }));
    buttons.push({ msg: BUTTON_BACK, enable: true });

    sendBattleLog(this.socket, '스킬을 선택하여 몬스터를 공격하세요', buttons);
  }

  async handleInput(responseCode) {
    if (!this.isValidResponseCode(responseCode)) {
      invalidResponseCode(this.socket);
      return;
    }

    if (responseCode === this.user.userSkills.length + 1) {
      this.changeState(ActionState);
      return;
    }

    const skillIndex = responseCode - 1;
    const selectedSkill = this.user.userSkills[skillIndex];

    if (this.user.stat.mp < selectedSkill.mana) {
      invalidResponseCode(this.socket);
      return;
    }

    this.dungeon.selectedSkill = skillIndex;

    if (selectedSkill.id >= AREASKILL) {
      this.changeState(PlayerAttackState);
    } else {
      this.changeState(TargetState);
    }
  }

  isValidResponseCode(code) {
    return code >= 1 && code <= this.user.userSkills.length + 1;
  }
}
