import { SKILL_RANK } from '../../constants/battle.js';

export const getRankName = (rank) => {
  switch (rank) {
    case SKILL_RANK.NORMAL:
      return '노말';
    case SKILL_RANK.RARE:
      return '레어';
    case SKILL_RANK.EPIC:
      return '에픽';
    case SKILL_RANK.UNIQUE:
      return '유니크';
    case SKILL_RANK.LEGENDARY:
      return '전설';
    default:
      return 'UNKNOWN';
  }
};
