// src/utils/response/createResponse.js

import { PACKET_ID_LENGTH, PACKET_SIZE_LENGTH } from '../../constants/constants.js';
import { getProtoMessagesById } from '../../init/loadProto.js';
import logger from '../log/logger.js';

// 응답 패킷 생성
export const createResponse = (packetId, data = null) => {
  const messageType = getProtoMessagesById(packetId);

  if (!messageType) {
    logger.error(`지원되지 않는 PacketId입니다: ${packetId}`);
    return Buffer.alloc(0); // 빈 버퍼 반환
  }

  let packetData;
  try {
    packetData = messageType.encode(data).finish();
  } catch (error) {
    logger.error('인코딩 실패:', error);
    throw error;
  }

  const packetSize = PACKET_SIZE_LENGTH + PACKET_ID_LENGTH + packetData.length;
  const packetSizeBuffer = Buffer.alloc(PACKET_SIZE_LENGTH);
  packetSizeBuffer.writeUInt32BE(packetSize, 0);

  const packetIdBuffer = Buffer.alloc(PACKET_ID_LENGTH);
  packetIdBuffer.writeUInt8(packetId, 0);

  return Buffer.concat([packetSizeBuffer, packetIdBuffer, packetData]);
};
