// src/handler/index.js

import { PacketType } from '../constants/header.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import CustomError from '../utils/error/customError.js';
import registerRequestHandler from './user/registerRequest.handler.js';
import loginRequestHandler from './user/loginRequest.handler.js';
import matchRequestHandler from './user/matchRequest.handler.js';
import { spawnMonsterRequestHandler } from './game/spawnMonsterRequest.handler.js';
import { towerAttackRequestHandler } from './game/towerAttackRequest.handler.js';
import monsterAttackBaseRequestHandler from './game/monsterAttackBaseRequest.handler.js';
import monsterDeathNotification from './notification/monsterDeath.notification.js';
import towerPurchaseRequestHandler from './game/towerPurchaseRequest.handler.js';

const handlers = {
  [PacketType.C_ENTER]: {
    handler: undefined
  },
  [PacketType.S_ENTER]: {
    handler: undefined
  },
  [PacketType.S_SPAWN]: {
    handler: undefined
  },
  [PacketType.C_LEAVE]: {
    handler: undefined
  },
  [PacketType.S_LEAVE]: {
    handler: undefined
  },
  [PacketType.S_DESPAWN]: {
    handler: undefined
  },
  [PacketType.C_MOVE]: {
    handler: undefined
  },
  [PacketType.S_MOVE]: {
    handler: undefined
  },
  [PacketType.C_ANIMATION]: {
    handler: undefined
  },
  [PacketType.S_ANIMATION]: {
    handler: undefined
  },
  [PacketType.C_CHANGE_COSTUME]: {
    handler: undefined
  },
  [PacketType.S_CHANGE_COSTUME]: {
    handler: undefined
  },
  [PacketType.C_CHAT]: {
    handler: undefined
  },
  [PacketType.S_CHAT]: {
    handler: undefined
  },
  [PacketType.C_ENTER_DUNGEON]: {
    handler: undefined
  },
  [PacketType.C_PLAYER_RESPONSE]: {
    handler: undefined
  },
  [PacketType.S_ENTER_DUNGEON]: {
    handler: undefined
  },
  [PacketType.S_LEAVE_DUNGEON]: {
    handler: undefined
  },
  [PacketType.S_SCREEN_TEXT]: {
    handler: undefined
  },
  [PacketType.S_SCREEN_DONE]: {
    handler: undefined
  },
  [PacketType.S_BATTLE_LOG]: {
    handler: undefined
  },
  [PacketType.S_SET_PLAYER_HP]: {
    handler: undefined
  },
  [PacketType.S_SET_PLAYER_MP]: {
    handler: undefined
  },
  [PacketType.S_SET_MONSTER_HP]: {
    handler: undefined
  },
  [PacketType.S_PLAYER_ACTION]: {
    handler: undefined
  },
  [PacketType.S_MONSTER_ACTION]: {
    handler: undefined
  },
};

export const getHandlerByPacketType = (packetType) => {
  if (!handlers[packetType]) {
    throw new CustomError(
      ErrorCodes.UNKNOWN_HANDLER_ID,
      `핸들러를 찾을 수 없습니다: ID ${packetType}`,
    );
  }
  return handlers[packetType].handler;
};