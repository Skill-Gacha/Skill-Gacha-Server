// src/handler/town/enhanceForge/cEnhanceHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { getNextRankAndSameElement, getSkillById } from '../../../init/loadAssets.js';
import { saveRewardSkillsToRedis } from '../../../db/redis/skillService.js';
import { cEnhanceUiHandler } from './cEnhanceUiHandler.js';
import logger from '../../../utils/log/logger.js';

export const cEnhanceHandler = async ({ socket, payload }) => {
  try {
    const user = sessionManager.getUserBySocket(socket);
    if (!user) {
      logger.error('cEnhanceHandler: 사용자를 찾을 수 없습니다.');
    }

    const { skillCode } = payload;

    const currentSkill = getSkillById(skillCode);
    if (!currentSkill) {
      logger.error('cEnhanceHandler: 잘못된 스킬 코드입니다.');
    }

    const { requiredStone, requiredGold, successRate, downgradeRate } = getEnhanceRequirements(
      currentSkill.rank,
    );

    // 자원 확인
    if (!hasSufficientResources(user, requiredStone, requiredGold)) {
      logger.error('cEnhanceHandler: 자원이 부족합니다.');
      return sendEnhanceResponse(socket, false);
    }

    // 자원 차감
    await user.reduceResource(requiredGold, requiredStone);

    // 강화 결과 결정
    const isSuccess = Math.random() < successRate;
    const isDowngrade = !isSuccess && Math.random() < downgradeRate;

    if (isSuccess) {
      await handleSkillUpgrade(user, currentSkill, skillCode, socket);
    } else if (isDowngrade) {
      await handleSkillDowngrade(user, currentSkill, skillCode, socket);
    } else {
      await cEnhanceUiHandler({ socket });
      return sendEnhanceResponse(socket, false);
    }
  } catch (error) {
    logger.error(`cEnhanceHandler 에러 발생: ${error.message}`);
    return sendEnhanceResponse(socket, false);
  }
};

const getEnhanceRequirements = (rank) => {
  switch (rank) {
    case 100:
      return { requiredStone: 5, requiredGold: 1000, successRate: 0.5, downgradeRate: 0 };
    case 101:
      return { requiredStone: 20, requiredGold: 3000, successRate: 0.3, downgradeRate: 0 };
    case 102:
      return { requiredStone: 30, requiredGold: 5000, successRate: 0.1, downgradeRate: 0.1 };
    case 103:
      return { requiredStone: 50, requiredGold: 10000, successRate: 0.05, downgradeRate: 0.05 };
    case 104:
      throw new Error('cEnhanceHandler: 레전더리 스킬은 더 이상 업그레이드할 수 없습니다.');
    default:
      throw new Error('cEnhanceHandler: 잘못된 스킬 랭크입니다.');
  }
};

const hasSufficientResources = (user, requiredStone, requiredGold) => {
  return user.stone >= requiredStone && user.gold >= requiredGold;
};

const handleSkillUpgrade = async (user, currentSkill, skillCode, socket) => {
  const nextRankSkillId = getNextRankAndSameElement(currentSkill.rank + 1, currentSkill.element);
  if (!nextRankSkillId) {
    throw new Error('cEnhanceHandler: 다음 랭크의 스킬을 찾을 수 없습니다.');
  }

  await updateUserSkill(user, skillCode, nextRankSkillId);
  await cEnhanceUiHandler({ socket });
  return sendEnhanceResponse(socket, true);
};

const handleSkillDowngrade = async (user, currentSkill, skillCode, socket) => {
  const downgradeSkillId = getNextRankAndSameElement(currentSkill.rank - 1, currentSkill.element);
  if (!downgradeSkillId) {
    throw new Error('cEnhanceHandler: 하락할 스킬을 찾을 수 없습니다.');
  }

  await updateUserSkill(user, skillCode, downgradeSkillId);
  await cEnhanceUiHandler({ socket });
  return sendEnhanceResponse(socket, false);
};

const updateUserSkill = async (user, oldSkillId, newSkillId) => {
  const skillIndex = user.userSkills.findIndex((skill) => skill.id === oldSkillId);
  const newSkill = getSkillById(newSkillId);

  if (skillIndex === -1) {
    throw new Error('cEnhanceHandler: 잘못된 스킬 인덱스입니다.');
  }

  user.userSkills.splice(skillIndex, 1, newSkill);

  // Redis에 업데이트
  await saveRewardSkillsToRedis(user.nickname, newSkillId, skillIndex + 1);
};

const sendEnhanceResponse = (socket, success) => {
  socket.write(createResponse(PacketType.S_EnhanceResponse, { success }));
};
