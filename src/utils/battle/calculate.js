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

//스팀팩의 딜로직
export const berserkDamage = (baseDamage, isBerserk) => {
  try {
    let damageMultiplier = 1; // 기본 대미지 배율

    // 스팀팩 효과가 활성화된 경우
    if (isBerserk) {
      damageMultiplier = 2; // 대미지 2배  여기서 조정하면될것같은데 수치 계산 
    }

    // 최종 대미지 계산
    const finalDamage = baseDamage * damageMultiplier;
    return finalDamage;
  } catch (error) {
    console.error('딜 계산 중 오류 발생', error);
  }
};



//저항값 다 불러오고 올 100

//위험한 포션의 저항

//위험한 포션의 딜로직
