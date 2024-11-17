// handler/dungeon/transitions/switchToEnemyAttackState.js

import { DUNGEON_STATUS } from '../../../constants/battle.js';
import handleEnemyAttackState from '../battleFlows/handleEnemyAttackState.js';

export default async function switchToEnemyAttackState(dungeon, user, socket) {
  dungeon.dungeonStatus = DUNGEON_STATUS.ENEMY_ATTACK;
  await handleEnemyAttackState(0, dungeon, user, socket);
}
