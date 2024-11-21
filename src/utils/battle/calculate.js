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

export const enemyResist = (skillElement, target) => {
  const resistList = ['electricResist', 'eartgResist', 'grassResist', 'fireResist', 'waterResist'];
  const resistKey = skillElement - 1001;
  const resist = resistList[resistKey];

  if (target.stat) {
    const playerResist = target.stat.resistances[resist];
    return playerResist;
  } else {
    const monsterResist = target.resistances[resist];
    return monsterResist;
  }
};
