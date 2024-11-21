// src/utils/battle/battle.js

// 자신
export const MyStatus = (my) => {
  return {
    playerClass: my.element,
    playerLevel: my.stat.level,
    playerName: my.nickname,
    playerFullHp: my.stat.maxHp,
    playerFullMp: my.stat.maxMp,
    playerCurHp: my.stat.hp,
    playerCurMp: my.stat.mp,
  };
};

// 상대
export const OpponentStatus = (opponent) => {
  return {
    playerClass: opponent.element,
    playerLevel: opponent.stat.level,
    playerName: opponent.nickname,
    playerFullHp: opponent.stat.maxHp,
    playerCurHp: opponent.stat.hp,
  };
};