// src/handler/dungeon/states/rewardState.js

import {
  CONFIRM_TYPE,
  DUNGEON_STATUS,
  MAX_REWARD_BUTTON,
  MAX_SKILL_COUNT,
} from '../../../constants/battle.js';
import { PacketType } from '../../../constants/header.js';
import { updateItemCountInRedis } from '../../../db/redis/itemService.js';
import { getSkillById } from '../../../init/loadAssets.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { getRankName } from '../../../utils/skill/getRankName.js';
import { setConfirmForDuplicateSkill } from '../../../utils/skill/skillDuplication.js';
import ConfirmState from './confirmState.js';
import DungeonState from './dungeonState.js';
import GameOverWinState from './gameOverWinState.js';
import SkillChangeState from './skillChangeState.js';

// 보상 처리
export default class RewardState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.REWARD;
    const { gold, stone, rewardSkills, item } = this.dungeon.reward;

    let msg;

    // 골드 및 강화석 증가
    this.user.increaseGold(gold);
    this.user.increaseStone(stone);

    msg = `Gold가 ${gold}만큼 증가하였습니다.\n강화석 ${stone}개를 얻었습니다.\n아래 스킬중 1개의 스킬을 선택하여 스킬을 획득하세요`;

    // 아이템 획득
    if (item !== null) {
      const userHasItem = this.user.items.some(
        (userItem) => userItem.itemId === item && userItem.count >= 1,
      );
      if (!userHasItem) {
        this.user.increaseItem(item);
        msg = `Gold가 ${gold}만큼 증가하였습니다.\n강화석 ${stone}개를 얻었습니다.\n아래 스킬중 1개의 스킬을 선택하여 스킬을 획득하세요 \n일정 확률로 아이템을 획득하였습니다!`;
        try {
          await updateItemCountInRedis(this.user.nickname, item, 1);
        } catch (error) {
          console.error('아이템 업데이트 중 오류 발생:', error);
        }
      }
      msg = `Gold가 ${gold}만큼 증가하였습니다.\n강화석 ${stone}개를 얻었습니다.\n아래 스킬중 1개의 스킬을 선택하여 스킬을 획득하세요 \n이미 아이템을 보유하고 있어 획득할 수 없습니다.`;
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

    // 보상로그 데이터
    const battleLog = {
      msg,
      typingAnimation: false,
      btns: buttons,
    };

    const rewardBattlelogResponse = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(rewardBattlelogResponse);
  }

  async handleInput(responseCode) {
    // responseCode 유효성 검사
    if (responseCode < 1 || responseCode > MAX_REWARD_BUTTON) {
      invalidResponseCode(this.socket);
    }

    if (responseCode === 4) {
      this.changeState(ConfirmState);
      await this.dungeon.currentState.setConfirm(
        CONFIRM_TYPE.GIVEUP,
        '스킬 보상을 정말로 포기하시나요?',
      );
    } else {
      // rewardSkills에서 해당 인덱스를 찾아 skillId를 추출
      const rewardSkillId = this.dungeon.reward.rewardSkills[responseCode - 1].id;
      const rewardskill = getSkillById(rewardSkillId);
      this.dungeon.newSkill = rewardskill;

      // 이미 보유한 스킬인지 확인
      const existingSkill = this.user.userSkills.find((s) => s.id === rewardskill.id);
      const stoneCount = this.dungeon.reward.stone;

      // 이미 4개의 스킬을 보유하고 있다면
      if (this.user.userSkills.length >= MAX_SKILL_COUNT) {
        // 가지고 있는 스킬이라면 강화석으로 대체
        if (existingSkill) {
          this.changeState(ConfirmState);
          await setConfirmForDuplicateSkill(this.dungeon, stoneCount);
        }
        // 가지고 있지 않다면 스킬 체인지
        else {
          this.changeState(SkillChangeState);
        }
      }
      // 스킬 슬롯에 여유가 있다면 스킬 추가
      else {
        // 단 스킬을 가지고 있다면 강화석으로 대체
        if (existingSkill) {
          this.changeState(ConfirmState);
          await setConfirmForDuplicateSkill(this.dungeon, stoneCount);
        } else {
          this.user.addSkill(rewardskill, responseCode);
          this.changeState(GameOverWinState);
        }
      }
    }
  }
}
