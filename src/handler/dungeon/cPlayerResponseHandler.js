// src/handler/dungeon/cPlayerResponseHandler.js

import { DUNGEON_STATUS } from '../../constants/battle.js';
import handleMessageState from './battleFlows/handleMessageState.js';
import handleActionState from './battleFlows/handleActionState.js';
import handleTargetState from './battleFlows/handleTargetState.js';
import handlePlayerAttackState from './battleFlows/handlePlayerAttackState.js';
import handleEnemyAttackState from './battleFlows/handleEnemyAttackState.js';
import handleMonsterDeadState from './battleFlows/handleMonsterDeadState.js';
import handleConfirmState from './battleFlows/handleConfirmState.js';
import handleGameOverWinResponse from './battleFlows/handleGameOverWinResponse.js';
import handleGameOverLoseResponse from './battleFlows/handleGameOverLoseResponse.js';
import handleUseItemState from './battleFlows/handleUseItemState.js'; // 아이템 사용 핸들러 추가
import sessionManager from '#managers/SessionManager.js';
import handleFleeMessage from './battleFlows/handleFleeMessage.js';

export const cPlayerResponseHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);
  const dungeon = sessionManager.getDungeonByUser(user);
  const responseCode = payload.responseCode || 0;
  console.log(`Response Code: ${responseCode}`);

  if (!user || !dungeon) {
    console.error('cPlayerResponseHandler: 유저 또는 던전 세션을 찾을 수 없습니다.');
    return;
  }

  // 상태별 핸들러 매핑
  const stateHandlers = {
    [DUNGEON_STATUS.MESSAGE]: handleMessageState,
    [DUNGEON_STATUS.ACTION]: handleActionState,
    [DUNGEON_STATUS.TARGET]: handleTargetState,
    [DUNGEON_STATUS.PLAYER_ATTACK]: handlePlayerAttackState,
    [DUNGEON_STATUS.ENEMY_ATTACK]: handleEnemyAttackState,
    [DUNGEON_STATUS.MONSTER_DEAD]: handleMonsterDeadState,
    [DUNGEON_STATUS.GAME_OVER_WIN]: handleGameOverWinResponse,
    [DUNGEON_STATUS.GAME_OVER_LOSE]: handleGameOverLoseResponse,
    [DUNGEON_STATUS.CONFIRM]: handleConfirmState,
    [DUNGEON_STATUS.USE_ITEM]: handleUseItemState,
    [DUNGEON_STATUS.FLEE_MESSAGE]: handleFleeMessage,
  };

  const handler = stateHandlers[dungeon.dungeonStatus];

  if (handler) {
    await handler(responseCode, dungeon, user, socket);
  } else {
    console.error(`알 수 없는 던전 상태: ${dungeon.dungeonStatus}`);
  }
};
