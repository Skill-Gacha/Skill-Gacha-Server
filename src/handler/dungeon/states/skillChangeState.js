// src/handler/dungeon/states/skillChangeState.js

import DungeonState from './dungeonState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import ConfirmState from './confirmState.js';
import { CONFIRM_TYPE } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';

// 스킬 교체 처리
export default class SkillChangeState extends DungeonState {
  async enter() {
    // 버튼은 플레이어가 보유한 스킬들로 생성
    const buttons = this.user.userSkills.map((skill) => ({
      msg: skill.skillName,
      enable: true,
    }));

    // 교환로그 데이터
    const battleLog = {
      msg: '선택된 스킬은 삭제되며 새로운 스킬이 추가됩니다.',
      typingAnimation: false,
      btns: buttons,
    };

    const changeSkillBattlelogResponse = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(changeSkillBattlelogResponse);
  }

  async handleInput(responseCode) {
    // responseCode 유효성 검사
    if (responseCode < 1 || responseCode > this.user.userSkills.length) {
      invalidResponseCode(this.socket);
    }

    const deleteSkillIdx = responseCode - 1;
    const newSkill = this.dungeon.newSkill;

    // 한번 더 확인하기
    this.changeState(ConfirmState);
    await this.dungeon.currentState.setConfirm(
      CONFIRM_TYPE.SKILLCHANGE,
      `${this.user.userSkills[deleteSkillIdx].skillName} 스킬과 교환하시겠습니까?`,
    );
    await this.dungeon.currentState.setChangeSkill(deleteSkillIdx, newSkill);
  }
}
