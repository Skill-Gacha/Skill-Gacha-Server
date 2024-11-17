// src/handler/dungeon/cPlayerResponseHandler.js

import { DUNGEON_STATUS } from '../../constants/battle.js';
import handleMessageState from './battleFlows/handleMessageState.js';
import handleActionState from './battleFlows/handleActionState.js';
import handleTargetState from './battleFlows/handleTargetState.js';
import handlePlayerAttackState from './battleFlows/handlePlayerAttackState.js';
import handleEnemyAttackState from './battleFlows/handleEnemyAttackState.js';
import handleMonsterDeadState from './battleFlows/handleMonsterDeadState.js';
import handleGameOverWinState from './battleFlows/handleGameOverWinState.js';
import handleGameOverLoseState from './battleFlows/handleGameOverLoseState.js';
import handleConfirmState from './battleFlows/handleConfirmState.js';
import sessionManager from '#managers/SessionManager.js';
// import handleItemSelectionState from './battleFlows/handleItemSelectionState.js';
// import handleItemUsageState from './battleFlows/handleItemUsageState.js';

export const cPlayerResponseHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);
  const dungeon = sessionManager.getDungeonByUser(user);
  const responseCode = payload.responseCode || 0;
  console.log(responseCode);

  if (!user || !dungeon) {
    console.error('cPlayerResponseHandler: 유저 또는 던전 세션을 찾을 수 없습니다.');
    return;
  }

  switch (dungeon.dungeonStatus) {
    case DUNGEON_STATUS.MESSAGE:
      await handleMessageState(responseCode, dungeon, user, socket);
      break;
    case DUNGEON_STATUS.ACTION:
      await handleActionState(responseCode, dungeon, user, socket);
      break;
    case DUNGEON_STATUS.TARGET:
      await handleTargetState(responseCode, dungeon, user, socket);
      break;
    case DUNGEON_STATUS.PLAYER_ATTACK:
      await handlePlayerAttackState(dungeon, user, socket);
      break;
    case DUNGEON_STATUS.ENEMY_ATTACK:
      await handleEnemyAttackState(responseCode, dungeon, user, socket);
      break;
    case DUNGEON_STATUS.MONSTER_DEAD:
      await handleMonsterDeadState(responseCode, dungeon, user, socket);
      break;
    case DUNGEON_STATUS.GAME_OVER_WIN:
      await handleGameOverWinState(responseCode, dungeon, user, socket);
      break;
    case DUNGEON_STATUS.GAME_OVER_LOSE:
      await handleGameOverLoseState(dungeon, user);
      break;
    case DUNGEON_STATUS.CONFIRM:
      await handleConfirmState(responseCode, dungeon, user, socket);
      break;
    // case DUNGEON_STATUS.ITEM_SELECTION:
    //   await handleItemSelectionState(responseCode, dungeon, user, socket);
    //   break;
    // case DUNGEON_STATUS.ITEM_USAGE:
    //   await handleItemUsageState(responseCode, dungeon, user, socket);
    //   break;
    default:
      console.error(`알 수 없는 던전 상태: ${dungeon.dungeonStatus}`);
      break;
  }
};
