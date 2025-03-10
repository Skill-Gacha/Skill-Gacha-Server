// src/handler/boss/states/action/bossSkillChoiceState.js

import { BOSS_STATUS, MAX_BUTTON_COUNT } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import BossActionState from './bossActionState.js';
import BossRoomState from '../base/bossRoomState.js';
import BossPlayerAttackState from '../combat/bossPlayerAttackState.js';
import { sendBossBattleLog } from '../../../../utils/battle/bossHelpers.js';

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

    sendBossBattleLog(this.user, '스킬을 선택하여 몬스터를 공격하세요', buttons);
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
