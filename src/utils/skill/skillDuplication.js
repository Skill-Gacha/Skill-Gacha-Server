import { CONFIRM_TYPE } from '../../constants/battle.js';

export const setConfirmForDuplicateSkill = async (dungeon, stoneCount) => {
  await dungeon.currentState.setConfirm(
    CONFIRM_TYPE.STONE,
    `중복된 스킬이 존재하여 강화석 ${stoneCount} 개로 대체됩니다. 강화석으로 받으시겠습니까?`,
  );
};
