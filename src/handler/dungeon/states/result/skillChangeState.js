// src/handler/dungeon/states/skillChangeState.js

import DungeonState from '../base/dungeonState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import ConfirmState from '../confirm/confirmState.js';
import { CONFIRM_TYPE, DUNGEON_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import RewardState from './rewardState.js';

const BUTTON_BACK = '뒤로 가기';

export default class SkillChangeState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.SKILL_CHANGE;

    const buttons = this.user.userSkills.map((skill) => ({
      msg: skill.skillName,
      enable: true,
    }));

    buttons.push({
      msg: BUTTON_BACK,
      enable: true,
    });

    const battleLog = {
      msg: '선택된 스킬은 삭제되며 새로운 스킬이 추가됩니다.',
      typingAnimation: false,
      btns: buttons,
    };

    this.socket.write(
      createResponse(PacketType.S_BattleLog, { battleLog }),
    );
  }

  async handleInput(responseCode) {
    if (!this.isValidResponseCode(responseCode)) {
      invalidResponseCode(this.socket);
      return;
    }

    if (responseCode === this.user.userSkills.length + 1) { // 뒤로 가기 버튼
      this.changeState(RewardState);
      return;
    }

    const deleteSkillIdx = responseCode - 1;
    const newSkill = this.dungeon.newSkill;

    this.changeState(ConfirmState);
    await this.dungeon.currentState.setConfirm(
      CONFIRM_TYPE.SKILLCHANGE,
      `${this.user.userSkills[deleteSkillIdx].skillName} 스킬과 교환하시겠습니까?`,
    );
    await this.dungeon.currentState.setChangeSkill(deleteSkillIdx, newSkill);
  }

  isValidResponseCode(code) {
    return code >= 1 && code <= this.user.userSkills.length + 1;
  }
}
