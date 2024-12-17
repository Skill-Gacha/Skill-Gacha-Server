// src/utils/battle/calculate.js

import { DAMAGE_RATE_MAP, DUNGEON_DEAD_RESOURCES } from '../../constants/battle.js';
import logger from '../log/logger.js';

export const RESISTANCE_KEYS = {
  1001: 'electricResist',
  1002: 'earthResist',
  1003: 'grassResist',
  1004: 'fireResist',
  1005: 'waterResist',
};

export const ELEMENT_KEYS = {
  1001: 'electric',
  1002: 'earth',
  1003: 'grass',
  1004: 'fire',
  1005: 'water',
};

// 스킬 강화율 계산
export const skillEnhancement = (playerElement, skillElement) => {
  try {
    if (DAMAGE_RATE_MAP[playerElement] && DAMAGE_RATE_MAP[playerElement][skillElement]) {
      return DAMAGE_RATE_MAP[playerElement][skillElement];
    }
    return 1;
  } catch (error) {
    logger.error('calculate: 속성 일치 여부 확인 중 오류 발생', error);
    return 1;
  }
};

// 적 저항력 체크
export const checkEnemyResist = (skillElement, target) => {
  const resistKey = RESISTANCE_KEYS[skillElement];
  if (!resistKey) {
    logger.error(`calculate: 존재하지 않는 속성 코드: ${skillElement}`);
    return 0;
  }
  return target.resistances[resistKey] || 0;
};

// 스토퍼 저항 체크
export const checkStopperResist = (skillElement, target) => {
  const resistKey = RESISTANCE_KEYS[skillElement];
  if (!resistKey) {
    logger.error(`calculate: 존재하지 않는 속성 코드: ${skillElement}`);
    return 0;
  }
  return target.stat.resistances[resistKey] || 0;
};

// 스팀팩, 위험한 포션 효과 등 데미지 업데이트
export const updateDamage = (user, userDamage, dungeonArea = false) => {
  let multiplier = 0;
  if (user.stat.battleCry) {
    multiplier += 2;
    if (!dungeonArea) user.stat.battleCry = false;
  }
  if (user.stat.stimPack) {
    multiplier += 2.5;
    if (!dungeonArea) user.stat.stimPack = false;
  }
  if (user.stat.dangerPotion) {
    multiplier += 5;
    if (!dungeonArea) user.stat.dangerPotion = false;
  }

  return multiplier === 0 ? userDamage : userDamage * multiplier;
};

// 사망 리소스 계산
export const deadResource = (user, dungeonCode) => {
  const resource = DUNGEON_DEAD_RESOURCES[dungeonCode];

  if (!resource) {
    logger.error(`deadResource: 알 수 없는 던전 코드 ${dungeonCode}`);
    return;
  }

  user.reduceResource(resource.gold, resource.stone);
};
