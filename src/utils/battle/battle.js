// src/utils/battle/battle.js

import { buffs } from '../../constants/battle.js';
import logger from '../log/logger.js';

// 내 상태를 반환
export const MyStatus = (my) => {
  return {
    playerClass: my.element,
    playerLevel: 1,
    playerName: my.nickname,
    playerFullHp: my.stat.maxHp,
    playerFullMp: my.stat.maxMp,
    playerCurHp: my.stat.hp,
    playerCurMp: my.stat.mp,
  };
};

// 상대 상태 반환
export const OpponentStatus = (opponent) => {
  return {
    playerClass: opponent.element,
    playerLevel: 1,
    playerName: opponent.nickname,
    playerFullHp: opponent.stat.maxHp,
    playerCurHp: opponent.stat.hp,
  };
};

// 버프 스킬 적용
export const buffSkill = (user, skillId) => {
  if (buffs[skillId]) {
    user.stat.buff = buffs[skillId];
  } else {
    logger.error(`buffSkill: 알 수 없는 스킬 ID: ${skillId}`);
  }
};
