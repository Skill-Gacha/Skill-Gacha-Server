// src/handler/index.js

import { PacketType } from '../constants/header.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import CustomError from '../utils/error/customError.js';
import { cChatHandler } from './town/cChatHandler.js';
import { cAnimationHandler } from './town/cAnimationHandler.js';
import { cEnterHandler } from './town/cEnterHandler.js';
import { cMoveHandler } from './town/cMoveHandler.js';
import { cEnterDungeonHandler } from './dungeon/cEnterDungeonHandler.js';
import { cPlayerResponseHandler } from './dungeon/cPlayerResponseHandler.js';
import { cPlayerMatchHandler } from './pvp/cPlayerMatchHandler.js';
import { cPlayerPvpResponseHandler } from './pvp/cPlayerPvpResponseHandler.js';
import { sInventoryViewHandler } from './town/inventory/sInventoryViewHandler.js';

const handlers = {
  [PacketType.C_Enter]: {
    handler: cEnterHandler,
    protoType: 'C_Enter',
  },
  [PacketType.C_Move]: {
    handler: cMoveHandler,
    protoType: 'C_Move',
  },
  [PacketType.C_Animation]: {
    handler: cAnimationHandler,
    protoType: 'C_Animation',
  },
  [PacketType.C_Chat]: {
    handler: cChatHandler,
    protoType: 'C_Chat',
  },
  [PacketType.C_EnterDungeon]: {
    handler: cEnterDungeonHandler,
    protoType: 'C_EnterDungeon',
  },
  [PacketType.C_PlayerResponse]: {
    handler: cPlayerResponseHandler,
    protoType: 'C_PlayerResponse',
  },
  [PacketType.C_PlayerMatch]: {
    handler: cPlayerMatchHandler,
    protoType: 'C_PlayerMatch',
  },
  [PacketType.C_PvpPlayerResponse]: {
    handler: cPlayerPvpResponseHandler,
    protoType: 'C_PVP_PLAYER_RESPONSE',
  },
  [PacketType.C_InventoryViewRequest]: {
    handler: sInventoryViewHandler,
    protoType: 'C_INVENTORY_VIEW_REQUEST',
  },
  // 다른 패킷 정의 추가...
};

export const getHandlerByPacketType = (packetType) => {
  if (!handlers[packetType] || !handlers[packetType].handler) {
    throw new CustomError(
      ErrorCodes.UNKNOWN_HANDLER_ID,
      `Handler not found for PacketType ID: ${packetType}`,
    );
  }
  return handlers[packetType].handler;
};
