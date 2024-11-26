// src/utils/battle/calculate.js

import { getElementById } from '../../init/loadAssets.js';
import { elementResist } from '../packet/playerPacket.js';

const RESISTANCE_KEYS = {
  1001: 'electricResist',
  1002: 'earthResist',
  1003: 'grassResist',
  1004: 'fireResist',
  1005: 'waterResist',
};

export const skillEnhancement = (playerElement, skillElement) => {
  try {
    return playerElement === skillElement ? 2 : 1;
  } catch (error) {
    console.error('calculate: 속성 일치 여부 확인 중 오류 발생', error);
  }
};

export const checkEnemyResist = (skillElement, target) => {
  const resistKey = RESISTANCE_KEYS[skillElement];
  if (!resistKey) {
    throw new Error(`calculate: 존재하지 않는 속성 코드 확인: ${skillElement}`);
  }
  return target.resistances[resistKey] || 0;
};

export const checkStopperResist = (skillElement, target) => {
  const resistKey = RESISTANCE_KEYS[skillElement];
  if (!resistKey) {
    throw new Error(`calculate: 존재하지 않는 속성 코드 확인: ${skillElement}`);
  }
  return target.stat.resistances[resistKey] || 0;
};

// 저항력 ALL 100
export const applyPotionEffect = (user) => {
  const resistances = user.stat.resistances;

  // 저항력을 최대치로 설정
  for (let resist in resistances) {
    resistances[resist] = 100;
  }

  user.resistbuff = true; // 포션 효과 활성화
  console.log(user.stat.resistances);
};

// 저항력 초기화 함수
export const resetResistances = (user) => {
  // 유저 클래스에 맞는 저항값들 다시 가져오기
  const element = getElementById(user.element);
  const resitances = elementResist(element);
  user.stat.resistances = resitances;
  user.stat.resistbuff = false;
};

// 스팀팩 효과 및 위험한 포션
export const updateDamage = (user, userDamage) => {
  if (user.stat.berserk && user.stat.dangerPotion) {
    userDamage *= 1.7;
    return userDamage;
  }
  user.stat.berserk ? (userDamage *= 1.2) : userDamage;
  user.stat.dangerPotion ? (userDamage *= 1.5) : userDamage;
  return userDamage;
};
