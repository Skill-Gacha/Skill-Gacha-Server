// src/handler/dungeon/states/confirmState.js

import DungeonState from './dungeonState.js';
import ActionState from './actionState.js';
import FleeMessageState from './fleeMessageState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { CONFIRM_TYPE, DUNGEON_STATUS } from '../../../constants/battle.js';
import RewardState from './rewardState.js';
import GameOverWinState from './gameOverWinState.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';

// 확인 버튼 출력을 위한 부분
export default class ConfirmState extends DungeonState {
  constructor(dungeon, user, socket) {
    super(dungeon, user, socket);
    this.confirmType = CONFIRM_TYPE.DEFAULT;
    this.message = '확인';
    this.deleteSkillIdx;
    this.changSkill;
  }

  async setConfirm(type, message) {
    this.confirmType = type;
    this.message = message;
    await this.enter();
  }

  async setChangeSkill(deleteSkillIdx, changeSkill) {
    this.deleteSkillIdx = deleteSkillIdx;
    this.changSkill = changeSkill;
  }

  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.CONFIRM;
    const buttons = [
      { msg: '예', enable: true },
      { msg: '아니오', enable: true },
    ];

    const battleLog = {
      msg: this.message,
      typingAnimation: false,
      btns: buttons,
    };

    const confirmBattlelogResponse = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(confirmBattlelogResponse);
  }

  async handleInput(responseCode) {
    switch (this.confirmType) {
      case CONFIRM_TYPE.FLEE:
        if (responseCode === 1) {
          // 도망감
          this.changeState(FleeMessageState);
        } else if (responseCode === 2) {
          // 도망 취소
          this.changeState(ActionState);
        } else {
          // 잘못된 입력 처리
        }
        break;
      case CONFIRM_TYPE.STONE: // 중복된 스킬에 대한 강화석 처리
        if (responseCode === 1) {
          // 강화석으로 받기
          this.user.increaseStone(this.dungeon.reward.stone);
          this.changeState(GameOverWinState); // 게임 승리
        } else if (responseCode === 2) {
          // 강화석 받기 취소
          this.changeState(RewardState); // 다시 보상 선택으로 돌아가기
        }
        break;
      case CONFIRM_TYPE.SKILLCHANGE: // 중복된 스킬에 대한 강화석 처리
        if (responseCode === 1) {
          // 스킬 교환 로직 작성해야 됨
          const deleteSkillIdx = this.deleteSkillIdx;
          this.user.userSkills.splice(deleteSkillIdx, 1); // 스킬 삭제
          this.user.userSkills.push(this.dungeon.newSkill); // 스킬 값 추가
          this.changeState(GameOverWinState); // 게임 승리
        } else if (responseCode === 2) {
          // 스킬 교환 취소
          this.changeState(RewardState); // 다시 보상 선택으로 돌아가기
        }
        break;
      default:
        // responseCode 유효성 검사
        invalidResponseCode(this.socket);
        break;
    }
  }
}
