// handler/dungeon/transitions/switchToGameOverLoseState.js

import handleGameOverLoseState from '../battleFlows/handleGameOverLoseState.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

export default async function switchToGameOverLoseState(responseCode, dungeon, user, socket) {
  dungeon.dungeonStatus = DUNGEON_STATUS.GAME_OVER_LOSE;
  await handleGameOverLoseState(0, dungeon, user, socket);
}
