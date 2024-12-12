// src/handler/dungeon/states/result/rewardState.js

import {
  CONFIRM_TYPE,
  DUNGEON_STATUS,
  MAX_REWARD_BUTTON,
  MAX_SKILL_COUNT,
  STONE,
} from '../../../../constants/battle.js';
import { updateItemCountInRedis } from '../../../../db/redis/itemService.js';
import { saveRewardSkillsToRedis } from '../../../../db/redis/skillService.js';
import { getSkillById } from '../../../../init/loadAssets.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { getRankName } from '../../../../utils/skill/getRankName.js';
import { setConfirmForDuplicateSkill } from '../../../../utils/skill/skillDuplication.js';
import ConfirmState from '../confirm/confirmState.js';
import DungeonState from '../base/dungeonState.js';
import GameOverWinState from './gameOverWinState.js';
import SkillChangeState from './skillChangeState.js';
import { updateUserResource } from '../../../../db/user/userDb.js';
import logger from '../../../../utils/log/logger.js';
import { sendBattleLog } from '../../../../utils/battle/dungeonHelpers.js';

export default class RewardState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.REWARD;
    const { gold, stone, rewardSkills, item } = this.dungeon.reward;

    try {
      this.user.increaseResource(gold, stone);
      await updateUserResource(this.user.nickname, this.user.gold, this.user.stone);
    } catch (error) {
      logger.error('RewardState: 자원 증가 중 오류 발생:', error);
      invalidResponseCode(this.socket);
      return;
    }

    let msg = `Gold가 ${gold}원 증가하였습니다.\n강화석 ${stone}개를 얻었습니다.\n아래 스킬 중 1개의 스킬을 선택하여 스킬을 획득하세요.`;

    if (item !== null) {
      const userInven = this.user.inventory;
      const userHasItem = userInven.items.find((i) => i.itemId === item);
      if (userHasItem && userHasItem.count !== 1 && userHasItem.count === 0) {
        msg += `\n일정 확률로 아이템을 획득하였습니다!`;
        try {
          await updateItemCountInRedis(this.user.nickname, item, 1);
          userHasItem.count += 1;
        } catch (error) {
          logger.error('RewardState: 아이템 업데이트 중 오류 발생:', error);
          invalidResponseCode(this.socket);
          return;
        }
      } else {
        msg += `\n이미 아이템을 보유하고 있어 획득할 수 없습니다.`;
      }
    }

    const buttons = rewardSkills.map((skill) => ({
      msg: `${skill.skillName}[${getRankName(skill.rank)}]`,
      enable: true,
    }));

    buttons.push({ msg: '포기하기', enable: true });

    sendBattleLog(this.socket, msg, buttons);
  }

  async handleInput(responseCode) {
    if (!this.isValidResponseCode(responseCode)) {
      invalidResponseCode(this.socket);
      return;
    }

    if (responseCode === MAX_REWARD_BUTTON) {
      this.changeState(ConfirmState);
      await this.dungeon.currentState.setConfirm(
        CONFIRM_TYPE.GIVEUP,
        '스킬 보상을 정말로 포기하시나요?',
      );
      return;
    }

    const selectedSkillIdx = responseCode - 1;
    const rewardSkill = this.dungeon.reward.rewardSkills[selectedSkillIdx];
    const rewardSkillId = rewardSkill.id;
    this.dungeon.newSkill = getSkillById(rewardSkillId);

    const existingSkill = this.user.userSkills.find((s) => s.id === rewardSkillId);
    const stoneCount = existingSkill ? STONE[existingSkill.rank] : null;
    this.dungeon.stoneCount = stoneCount;

    if (this.user.userSkills.length >= MAX_SKILL_COUNT) {
      if (existingSkill) {
        this.changeState(ConfirmState);
        await setConfirmForDuplicateSkill(this.dungeon, stoneCount);
      } else {
        this.changeState(SkillChangeState);
      }
    } else {
      // 스킬 슬롯 여유
      if (existingSkill) {
        this.changeState(ConfirmState);
        await setConfirmForDuplicateSkill(this.dungeon, stoneCount);
      } else {
        try {
          await saveRewardSkillsToRedis(this.user.nickname, rewardSkillId, null);
          this.changeState(GameOverWinState);
        } catch (error) {
          logger.error('RewardState: 스킬 저장 중 오류 발생:', error);
          invalidResponseCode(this.socket);
        }
      }
    }
  }

  isValidResponseCode(code) {
    return code >= 1 && code <= MAX_REWARD_BUTTON;
  }
}
