// src/utils/battle/calculate.js

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
export const applyPotionEffect = (target) => {
  const resistList = ['electricResist', 'earthResist', 'grassResist', 'fireResist', 'waterResist'];

  // 타겟이 저항력을 가지고 있는지 확인
  if (!target.resistances) {
    console.error('타겟에 저항력이 정의되어 있지 않습니다:', target);
    return;
  }

  // 저항력을 최대치로 설정
  resistList.forEach(type => {
    target.resistances[type] = 100;  // 저항력을 100으로 설정
  });

  target.resistbuff = true; // 포션 효과 활성화
};

// 저항력 초기화 함수
export const resetResistances = (target) => {
  if (target.originalResistances) {
    target.resistances = { ...target.originalResistances };  // 원래 저항력으로 되돌리기
    target.resistbuff = false; // 포션 효과 비활성화
  }
};


//스팀팩과 위험한 포션 효과
export const potionEffectDamage = (baseDamage, isBerserk, isDangerPotion) => {
  try {
    let damageMultiplier1 = 1; // 기본 대미지 배율
    let damageMultiplier2 = 1;
    // 스팀팩 효과가 활성화된 경우
    if (isBerserk) {
      damageMultiplier1 *= 2; // 대미지 2배
    }

    // 위험한 포션 효과가 활성화된 경우
    if (isDangerPotion) {
      damageMultiplier2 *= 5; // 대미지 5배
    }

    // 최종 대미지 계산
    const finalDamage = baseDamage * (damageMultiplier1 + damageMultiplier2) ; //7배 
    return finalDamage;
  } catch (error) {
    console.error('딜 계산 중 오류 발생', error);
  }

  
};

//위험한 포션의 저항

