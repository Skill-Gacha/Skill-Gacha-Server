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

export const checkEnemyResist = (skillElement, target) => {
  const resistKey = RESISTANCE_KEYS[skillElement];
  if (!resistKey) {
    logger.error(`calculate: 존재하지 않는 속성 코드 확인: ${skillElement}`);
  }
  return target.resistances[resistKey] || 0;
};

export const checkStopperResist = (skillElement, target) => {
  const resistKey = RESISTANCE_KEYS[skillElement];
  if (!resistKey) {
    logger.error(`calculate: 존재하지 않는 속성 코드 확인: ${skillElement}`);
  }
  return target.stat.resistances[resistKey] || 0;
};

// 스팀팩 효과 및 위험한 포션
export const updateDamage = (user, userDamage) => {
  let multiplier = 0; // 초기 배율 값
  if (user.stat.buff === 1 && user.stat.battleCry) {
    multiplier += 2; // "전투의 함성" 버프가 있으면 데미지 2배 증가
    user.stat.buff = null;
    user.stat.battleCry = false;
  }
  if (user.stat.berserk) {
    multiplier += 2.5; // 버서크가 있으면 2.5배 증가
    user.stat.berserk = false;
  }
  if (user.stat.dangerPotion) {
    multiplier += 5; // 위험한 포션이 있으면 5배 증가
    user.stat.dangerPotion = false;
  }
  // 최종 데미지 계산
  if (multiplier === 0) {
    return userDamage;
  }
  return (userDamage *= multiplier);
};

// 사망 보상 계산 함수
export const deadResource = (user, dungeonCode) => {
  const resource = DUNGEON_DEAD_RESOURCES[dungeonCode];

  if (!resource) {
    logger.error(`던전코드가 이상합니다.: ${dungeonCode}`);
    return;
  }

  user.reduceResource(resource.gold, resource.stone);
};
