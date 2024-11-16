// src/handler/dungeon/battleFlows/playerAttackState.js

import {
  STATE_OPPONENT_ATTACK,
  STATE_OPPONENT_DEAD,
  STATE_GAME_OVER_WIN, PVE_MODE, PVP_MODE,
} from '../../../constants/constants.js';
import opponentAttackState from './opponentAttackState.js';
import entityDeadState from './entityDeadState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';
import monsterDeadTransition from './transition/monsterDeadTransition.js';

const playerAttackState = (responseCode, dungeon, user) => {
  console.log('playerAttackState Called');

  if (dungeon.mode === PVE_MODE) {
    // 나중에 필요
  } else if (dungeon.mode === PVP_MODE) {
    // PvP 로직 구현 필요
  }
  
  monsterDeadTransition(dungeon, user);
};

export default playerAttackState;
