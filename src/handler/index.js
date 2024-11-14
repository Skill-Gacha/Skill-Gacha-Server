// src/handler/index.js

import { PacketType } from '../constants/header.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import CustomError from '../utils/error/customError.js';
import { sEnterDungeonHandler } from './dungeon/sEnterDungeonHandler.js';

const handlers = {
  [PacketType.C_Enter]: {
    handler: undefined,
    protoType: 'C_Enter',
  },
  [PacketType.C_Move]: {
    handler: undefined,
    protoType: 'C_Move',
  },
  [PacketType.C_Animation]: {
    handler: undefined,
    protoType: 'C_Animation',
  },
  [PacketType.C_Chat]: {
    handler: undefined,
    protoType: 'C_Chat',
  },
  [PacketType.C_EnterDungeon]: {
    handler: sEnterDungeonHandler,
    protoType: 'C_EnterDungeon',
  },
  [PacketType.C_PlayerResponse]: {
    handler: undefined,
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
