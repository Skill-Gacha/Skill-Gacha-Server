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
import FailFleeMessageState from './failFleeMessageState.js';
import { saveRewardSkillsToRedis } from '../../../db/redis/skillService.js';
import { updateUserResource } from '../../../db/user/userDb.js';

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
          if (this.user.gold < this.dungeon.dungeonCode * 100) {
            this.changeState(FailFleeMessageState);
          } else {
            this.user.reduceResource(this.dungeon.dungeonCode * 100, 0);
            await updateUserResource(this.user.nickname, this.user.gold, this.user.stone);
            this.changeState(FleeMessageState);
          }
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
          this.user.increaseResource(0, this.dungeon.reward.stone);
          await updateUserResource(this.user.nickname, this.user.gold, this.user.stone);
          this.changeState(GameOverWinState); // 게임 승리
        } else if (responseCode === 2) {
          // 강화석 받기 취소
          this.changeState(RewardState); // 다시 보상 선택으로 돌아가기
        }
        break;
      case CONFIRM_TYPE.SKILLCHANGE: // 중복된 스킬에 대한 강화석 처리
        if (responseCode === 1) {
          // 스킬 교환 로직
          try {
            await saveRewardSkillsToRedis(
              this.user.nickname,
              this.dungeon.newSkill.id,
              this.deleteSkillIdx + 1,
            );
          } catch (error) {
            console.error('스킬 교환 중 오류 발생:', error.message);
          }

          this.changeState(GameOverWinState); // 게임 승리
        } else if (responseCode === 2) {
          // 스킬 교환 취소
          this.changeState(RewardState); // 다시 보상 선택으로 돌아가기
        }
        break;
      case CONFIRM_TYPE.GIVEUP: // 스킬 보상 포기
        if (responseCode === 1) {
          // 포기
          this.changeState(GameOverWinState);
        } else if (responseCode === 2) {
          // 도망 취소
          this.changeState(RewardState);
        }
        break;
      default:
        // responseCode 유효성 검사
        invalidResponseCode(this.socket);
        break;
    }
  }
}
