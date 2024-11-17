// handler/dungeon/transitions/switchToMonsterDeadState.js

import { DUNGEON_STATUS } from '../../../constants/battle.js';
import handleMonsterDeadState from '../battleFlows/handleMonsterDeadState.js';

export default async function switchToMonsterDeadState(dungeon, user, socket) {
  dungeon.dungeonStatus = DUNGEON_STATUS.MONSTER_DEAD;
  await handleMonsterDeadState(0, dungeon, user, socket);
}
