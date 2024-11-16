// src/handler/dungeon/cPlayerResponseHandler.js

import { getUserBySocket } from '../../sessions/userSession.js';
import { getDungeonSessionByUser } from '../../sessions/dungeonSession.js';
import {
  STATE_MESSAGE_WINDOW,
  STATE_CHOOSE_ACTION,
  STATE_CHOOSE_TARGET,
  STATE_PLAYER_ATTACK,
  STATE_OPPONENT_ATTACK,
  STATE_CHOOSE_SKILL_TYPE,
  STATE_CHOOSE_TARGET_WITH_SKILL,
  STATE_OPPONENT_DEAD,
  STATE_ITEM_SELECT,
  STATE_ITEM_USING,
  STATE_GO_TO_TOWN,
  STATE_ITEM_CHOOSE,
  STATE_GAME_OVER_WIN,
  STATE_GAME_OVER_LOSE,
  STATE_CONFIRM,
} from '../../constants/constants.js';

// 씬 핸들러 임포트
import messageWindowState from './battleFlows/messageWindowState.js';
import chooseActionState from './battleFlows/chooseActionState.js';
import chooseTargetState from './battleFlows/chooseTargetState.js';
import playerAttackState from './battleFlows/playerAttackState.js';
import opponentAttackState from './battleFlows/opponentAttackState.js';
import entityDeadState from './battleFlows/entityDeadState.js';
import gameOverWinState from './battleFlows/gameOverWinState.js';
import gameOverLoseState from './battleFlows/gameOverLoseState.js';
// 필요한 다른 씬 핸들러들...

const cPlayerResponseHandler = async ({ socket, payload }) => {
  const user = await getUserBySocket(socket);
  const dungeon = getDungeonSessionByUser(user.id);
  const responseCode = payload.responseCode ? payload.responseCode : 0;
  console.log('Base Handler Response Code:', responseCode);

  if (!dungeon) {
    console.error('던전 세션이 없습니다.');
    return;
  }

  // 게임 모드에 따라 상대방 결정
  let opponent;
  if (dungeon.mode === 'PvE') {
    opponent = dungeon.monsters.find((monster) => monster.stat.hp > 0);
  } else if (dungeon.mode === 'PvP') {
    opponent = dungeon.users.find((u) => u.id !== user.id);
  }
  
  console.log('Base Handler Current State:', dungeon.currentBattleState);

  switch (dungeon.currentBattleState) {
    case STATE_MESSAGE_WINDOW:  // 0
      messageWindowState(responseCode, dungeon, user, opponent);
      break;
    case STATE_CHOOSE_ACTION:   // 1
      chooseActionState(responseCode, dungeon, user, opponent);
      break;
    case STATE_CHOOSE_TARGET:   // 2
      chooseTargetState(responseCode, dungeon, user, opponent);
      break;
    case STATE_PLAYER_ATTACK:   // 3 
      playerAttackState(responseCode, dungeon, user, opponent);
      break;
    case STATE_OPPONENT_ATTACK: // 4
      opponentAttackState(responseCode, dungeon, user, opponent);
      break;
    case STATE_OPPONENT_DEAD:   // 5
      entityDeadState(responseCode, dungeon, user, opponent);
      break;
    case STATE_CHOOSE_SKILL_TYPE:   // 6 
      entityDeadState(responseCode, dungeon, user);
      break;
    // case STATE_ITEM_SELECT:
    //   selectItemState(responseCode, dungeon, user);
    //   break;
    // case STATE_ITEM_USING:
    //   usingItemState(responseCode, dungeon, user);
    //   break;
    case STATE_GAME_OVER_WIN:
      gameOverWinState(responseCode, dungeon, user);
      break;
    case STATE_GAME_OVER_LOSE:
      gameOverLoseState(responseCode, dungeon, user);
      break;
      
      // 여기에 필요한 상태 추가
    default:
      console.error(`알 수 없는 던전 상태: ${dungeon.currentBattleState}`);
      break;
  }
};

export default cPlayerResponseHandler;
