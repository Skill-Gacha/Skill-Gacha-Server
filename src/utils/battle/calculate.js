// src/utils/battle/calculate.js

import { getElementById } from '../../init/loadAssets.js';
import { elementResist } from '../packet/playerPacket.js';

export const skillEnhancement = (playerElement, skillElement) => {
  try {
    let damageRate = 0;
    //속성이 일치하는지
    if (playerElement === skillElement) {
      damageRate = 2;
    } else {
      damageRate = 1;
    }
    return damageRate;
  } catch (error) {
    console.error('속성 일치 여부 확인 중 오류 발생', error);
  }
};

export const checkEnemyResist = (skillElement, target) => {
  const resistList = ['electricResist', 'earthResist', 'grassResist', 'fireResist', 'waterResist'];
  const resistKey = skillElement - 1001;
  const resist = resistList[resistKey];

  const monsterResist = target.resistances[resist];
  return monsterResist;
};

export const checkStopperResist = (skillElement, target) => {
  const resistList = ['electricResist', 'earthResist', 'grassResist', 'fireResist', 'waterResist'];
  const resistKey = skillElement - 1001;
  const resist = resistList[resistKey];

  const playerResist = target.stat.resistances[resist];
  return playerResist;
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
