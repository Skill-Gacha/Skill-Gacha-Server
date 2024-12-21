// src/utils/parser/packetParser.js

import { getProtoMessagesById } from '../../init/loadProto.js';
import logger from '../log/logger.js';
import CustomError from '../error/customError.js';
import { ErrorCodes } from '../error/errorCodes.js';

// 패킷 파서
export const packetParser = (packetId, data) => {
  const messageType = getProtoMessagesById(packetId);

  if (!messageType) {
    throw new CustomError(ErrorCodes.UNKNOWN_HANDLER_ID, `지원되지 않는 PacketId: ${packetId}`);
  }

  try {
    return messageType.decode(data);
  } catch (e) {
    logger.error(`PacketId ${packetId} 디코딩 오류:`, e);
    throw e;
  }
};
