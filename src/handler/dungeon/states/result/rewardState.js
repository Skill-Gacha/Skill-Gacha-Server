// src/handler/dungeon/states/rewardState.js

import {
  CONFIRM_TYPE,
  DUNGEON_STATUS,
  MAX_REWARD_BUTTON,
  MAX_SKILL_COUNT,
  STONE,
} from '../../../../constants/battle.js';
import { PacketType } from '../../../../constants/header.js';
import { updateItemCountInRedis } from '../../../../db/redis/itemService.js';
import { saveRewardSkillsToRedis } from '../../../../db/redis/skillService.js';
import { getSkillById } from '../../../../init/loadAssets.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { getRankName } from '../../../../utils/skill/getRankName.js';
import { setConfirmForDuplicateSkill } from '../../../../utils/skill/skillDuplication.js';
import ConfirmState from '../confirm/confirmState.js';
import DungeonState from '../base/dungeonState.js';
import GameOverWinState from './gameOverWinState.js';
import SkillChangeState from './skillChangeState.js';
import { updateUserResource } from '../../../../db/user/userDb.js';
import logger from '../../../../utils/log/logger.js';

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class RewardState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.REWARD;
    const { gold, stone, rewardSkills, item } = this.dungeon.reward;

    try {
      // 골드 및 강화석 증가
      this.user.increaseResource(gold, stone);
      await updateUserResource(this.user.nickname, this.user.gold, this.user.stone);
    } catch (error) {
      logger.error('RewardState: 자원 증가 중 오류 발생:', error);
      invalidResponseCode(this.socket);
      return;
    }

    // 반복되는 부분은 분리
    // 필요한 걸 붙이는 식으로 진행
    let msg = `Gold가 ${gold}원 증가하였습니다.\n강화석 ${stone}개를 얻었습니다.\n아래 스킬 중 1개의 스킬을 선택하여 스킬을 획득하세요.`;

    if (item !== null) {
      const userHasItem = this.user.items.find((i) => i.itemId === item);
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

    // 버튼 생성
    const buttons = rewardSkills.map((skill) => ({
      msg: `${skill.skillName}[${getRankName(skill.rank)}]`,
      enable: true,
    }));

    // 포기하기 버튼 추가
    buttons.push({
      msg: '포기하기',
      enable: true,
    });

    // 보상 로그 데이터
    const battleLog = {
      msg,
      typingAnimation: false,
      btns: buttons,
    };

    const rewardBattlelogResponse = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(rewardBattlelogResponse);
  }

  async handleInput(responseCode) {
    if (!this.isValidResponseCode(responseCode)) {
      invalidResponseCode(this.socket);
      return;
    }

    if (responseCode === MAX_REWARD_BUTTON) {
      // 포기하기 버튼
      this.changeState(ConfirmState);
      await this.dungeon.currentState.setConfirm(
        CONFIRM_TYPE.GIVEUP,
        '스킬 보상을 정말로 포기하시나요?',
      );
      return;
    }

    // 보상 스킬 선택 처리
    const selectedSkillIdx = responseCode - 1;
    const rewardSkill = this.dungeon.reward.rewardSkills[selectedSkillIdx];
    const rewardSkillId = rewardSkill.id;
    this.dungeon.newSkill = getSkillById(rewardSkillId);

    const existingSkill = this.user.userSkills.find((s) => s.id === rewardSkillId);
    const stoneCount = existingSkill ? STONE[existingSkill.rank] : null;
    this.dungeon.stoneCount = stoneCount;

    if (this.user.userSkills.length >= MAX_SKILL_COUNT) {
      if (existingSkill) {
        // 이미 있는 스킬일 경우
        this.changeState(ConfirmState);
        await setConfirmForDuplicateSkill(this.dungeon, stoneCount);
      } else {
        this.changeState(SkillChangeState);
      }
    } else {
      // 스킬 슬롯에 여유가 있는 경우
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
