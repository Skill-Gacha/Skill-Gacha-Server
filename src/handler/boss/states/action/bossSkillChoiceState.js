// src/handler/boss/states/action/bossSkillChoiceState.js

import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { BOSS_STATUS, MAX_BUTTON_COUNT } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import BossActionState from './bossActionState.js';
import BossRoomState from '../base/bossRoomState.js';
import BossPlayerAttackState from '../combat/bossPlayerAttackState.js';

export default class BossSkillChoiceState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.SKILL_CHOICE;

    const buttons = this.user.userSkills.map((skill) => ({
      msg: `${skill.skillName}(데미지 ${skill.damage} / 마나 ${skill.mana})`,
      enable: this.user.stat.mp >= skill.mana,
    }));

    buttons.push({
      msg: '뒤로 가기',
      enable: true,
    });

    const battleLog = {
      msg: '스킬을 선택하여 몬스터를 공격하세요',
      typingAnimation: false,
      btns: buttons,
    };

    const choiceSkillBattlelogResponse = createResponse(PacketType.S_BossBattleLog, { battleLog });
    this.user.socket.write(choiceSkillBattlelogResponse);
  }

  async handleInput(responseCode) {
    if (responseCode < 1 || responseCode > MAX_BUTTON_COUNT) {
      invalidResponseCode(this.user.socket);
    }

    if (responseCode > this.user.userSkills.length) {
      this.changeState(BossActionState);
    } else {
      const SkillIdx = responseCode - 1;
      this.bossRoom.selectedSkill = SkillIdx;
      this.changeState(BossPlayerAttackState);
    }
  }
}
