// src/handler/index.js

import { PacketType } from '../constants/header.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import CustomError from '../utils/error/customError.js';
import sPlayerResponseHandler from './dungeon/cPlayerResponseHandler.js';
import { cChatHandler } from './town/cChatHandler.js';
import { cAnimationHandler } from './town/cAnimationHandler.js';
import { sEnterHandler } from './town/sEnterHandler.js';
import { cMoveHandler } from './town/cMoveHandler.js';

const handlers = {
  [PacketType.C_Enter]: {
    handler: sEnterHandler,
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
    handler: undefined,
    protoType: 'C_EnterDungeon',
  },
  [PacketType.C_PlayerResponse]: {
    handler: sPlayerResponseHandler,
    protoType: 'C_PlayerResponse',
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
