// src/handler/dungeon/states/confirm/confirmState.js

import DungeonState from '../base/dungeonState.js';
import ActionState from '../action/actionState.js';
import FleeMessageState from '../flee/fleeMessageState.js';
import { CONFIRM_TYPE, DUNGEON_STATUS } from '../../../../constants/battle.js';
import RewardState from '../result/rewardState.js';
import GameOverWinState from '../result/gameOverWinState.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import FailFleeMessageState from '../flee/failFleeMessageState.js';
import { saveRewardSkillsToRedis } from '../../../../db/redis/skillService.js';
import { updateUserResource } from '../../../../db/user/userDb.js';
import { sendBattleLog } from '../../../../utils/battle/dungeonHelpers.js';

const BASE_FLEE_COST = 100;
const CONFIRM_BUTTONS = [
  { msg: '예', enable: true },
  { msg: '아니오', enable: true },
];

const CONFIRM_RESPONSES = {
  YES: 1,
  NO: 2,
};

export default class ConfirmState extends DungeonState {
  constructor(dungeon, user, socket) {
    super(dungeon, user, socket);
    this.confirmType = CONFIRM_TYPE.DEFAULT;
    this.message = '확인';
    this.deleteSkillIdx = null;
    this.changeSkill = null;
  }

  async setConfirm(type, message) {
    this.confirmType = type;
    this.message = message;
    await this.enter();
  }

  async setChangeSkill(deleteSkillIdx, changeSkill) {
    this.deleteSkillIdx = deleteSkillIdx;
    this.changeSkill = changeSkill;
  }

  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.CONFIRM;
    sendBattleLog(this.socket, this.message, CONFIRM_BUTTONS);
  }

  async handleInput(responseCode) {
    switch (this.confirmType) {
      case CONFIRM_TYPE.FLEE:
        await this.handleFleeResponse(responseCode);
        break;
      case CONFIRM_TYPE.STONE:
        await this.handleStoneResponse(responseCode);
        break;
      case CONFIRM_TYPE.SKILLCHANGE:
        await this.handleSkillChangeResponse(responseCode);
        break;
      case CONFIRM_TYPE.GIVEUP:
        await this.handleGiveUpResponse(responseCode);
        break;
      default:
        invalidResponseCode(this.socket);
        break;
    }
  }

  async handleFleeResponse(responseCode) {
    if (responseCode === CONFIRM_RESPONSES.YES) {
      const fleeCost = this.dungeon.dungeonCode * BASE_FLEE_COST;
      if (this.user.gold < fleeCost) {
        this.changeState(FailFleeMessageState);
      } else {
        this.user.reduceResource(fleeCost, 0);
        await updateUserResource(this.user.nickname, this.user.gold, this.user.stone);
        this.changeState(FleeMessageState);
      }
    } else if (responseCode === CONFIRM_RESPONSES.NO) {
      this.changeState(ActionState);
    } else {
      invalidResponseCode(this.socket);
    }
  }

  async handleStoneResponse(responseCode) {
    if (responseCode === CONFIRM_RESPONSES.YES) {
      this.user.increaseResource(0, this.dungeon.stoneCount);
      await updateUserResource(this.user.nickname, this.user.gold, this.user.stone);
      this.changeState(GameOverWinState);
    } else if (responseCode === CONFIRM_RESPONSES.NO) {
      this.changeState(RewardState);
    } else {
      invalidResponseCode(this.socket);
    }
  }

  async handleSkillChangeResponse(responseCode) {
    if (responseCode === CONFIRM_RESPONSES.YES) {
      try {
        await saveRewardSkillsToRedis(this.user.nickname, this.dungeon.newSkill.id, this.deleteSkillIdx + 1);
        this.changeState(GameOverWinState);
      } catch (error) {
        console.error('스킬 교환 중 오류 발생:', error.message);
      }
    } else if (responseCode === CONFIRM_RESPONSES.NO) {
      this.changeState(RewardState);
    } else {
      invalidResponseCode(this.socket);
    }
  }

  async handleGiveUpResponse(responseCode) {
    if (responseCode === CONFIRM_RESPONSES.YES) {
      this.changeState(GameOverWinState);
    } else if (responseCode === CONFIRM_RESPONSES.NO) {
      this.changeState(RewardState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
