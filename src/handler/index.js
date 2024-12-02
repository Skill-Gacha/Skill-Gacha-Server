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
import { cOpenStoreHandler } from './town/store/cOpenStoreHandler.js';
import { cBuyItemHandler } from './town/store/cBuyItemHandler.js';
import { cViewRankPointHandler } from './town/cViewRankPointHandler.js';
import { cInventoryViewHandler } from './town/inventory/cInventoryViewHandler.js';
import { cEnhanceHandler } from './town/enhanceForge/cEnhanceHandler.js';
import { cEnhanceUiHandler } from './town/enhanceForge/cEnhanceUiHandler.js';
import { handleError } from '../utils/error/errorHandler.js';

// 핸들러 매핑
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
    protoType: 'C_PvpPlayerResponse',
  },
  [PacketType.C_InventoryViewRequest]: {
    handler: cInventoryViewHandler,
    protoType: 'C_InventoryViewRequest',
  },
  [PacketType.C_OpenStoreRequest]: {
    handler: cOpenStoreHandler,
    protoType: 'C_OpenStoreRequest',
  },
  [PacketType.C_BuyItemRequest]: {
    handler: cBuyItemHandler,
    protoType: 'C_BuyItemRequest',
  },
  [PacketType.C_ViewRankPoint]: {
    handler: cViewRankPointHandler,
    protoType: 'C_ViewRankPoint',
  },

  [PacketType.C_EnhanceUiRequest]: {
    handler: cEnhanceUiHandler,
    protoType: 'C_EnhanceUiRequest',
  },
  [PacketType.C_EnhanceRequest]: {
    handler: cEnhanceHandler,
    protoType: 'C_EnhanceRequest',
  },

  // 다른 패킷 정의 추가...
};

export const getHandlerByPacketType = (packetType) => {
  if (!handlers[packetType] || !handlers[packetType].handler) {
    const newCustomError = new CustomError(
      ErrorCodes.UNKNOWN_HANDLER_ID,
      `PacketType ID에 해당하는 핸들러를 찾을 수 없습니다: ${packetType}`,
    );
    handleError(newCustomError);
  }
  return handlers[packetType].handler;
};
