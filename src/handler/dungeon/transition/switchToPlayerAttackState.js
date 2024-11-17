// src/handler/dungeon/transition/switchToPlayerAttackState.js

import { DUNGEON_STATUS } from '../../../constants/battle.js';
import handlePlayerAttackState from '../battleFlows/handlePlayerAttackState.js';

export default async function switchToPlayerAttackState(dungeon, user, socket) {
  dungeon.dungeonStatus = DUNGEON_STATUS.PLAYER_ATTACK;
  await handlePlayerAttackState(dungeon, user, socket);
}
