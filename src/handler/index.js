// src/handler/index.js

import { PacketType } from '../constants/header.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import CustomError from '../utils/error/customError.js';
import sAnimationHandler from './game/sAnimationHandler.js';

const handlers = {
  [PacketType.C_Enter]: {
    handler: undefined,
    protoType: 'C_Enter',
  },
  [PacketType.S_Animation]: { // 예시
    handler: sAnimationHandler,
    protoType: 'S_Animation',
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
