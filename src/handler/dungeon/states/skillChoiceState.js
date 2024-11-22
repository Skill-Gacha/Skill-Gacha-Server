// src/handler/dungeon/states/skillChoiceState.js

import DungeonState from './dungeonState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS, MAX_SKILL_COUNT } from '../../../constants/battle.js';
import PlayerAttackState from './playerAttackState.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';

// 스킬 선택 상태
export default class SkillChoiceState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.SKILL_CHOICE;
    // 버튼은 플레이어가 보유한 스킬들로 생성
    const buttons = this.user.userSkills.map((skill) => ({
      msg: `${skill.skillName}(데미지 ${skill.damage} / 마나 ${skill.mana})`,
      enable: this.user.stat.mp >= skill.mana,
    }));

    // 스킬 로그 데이터
    const battleLog = {
      msg: '스킬을 선택하여 몬스터를 공격하세요',
      typingAnimation: false,
      btns: buttons,
    };

    const choiceSkillBattlelogResponse = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(choiceSkillBattlelogResponse);
  }

  async handleInput(responseCode) {
    // responseCode 유효성 검사)
    if (responseCode < 1 || responseCode > MAX_SKILL_COUNT) {
      invalidResponseCode(this.socket);
    }

    // 선택한 스킬 인덱스 계산
    const SkillIdx = responseCode - 1;
    this.dungeon.selectedSkill = SkillIdx;

    // 스킬 선택 후 플레이어 어택 상태로 전환
    this.changeState(PlayerAttackState);
  }
}
