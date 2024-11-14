// src/utils/response/createResponse.js

import { PACKET_ID_LENGTH, PACKET_SIZE_LENGTH } from '../../constants/constants.js';
import { getProtoMessagesById } from '../../init/loadProto.js';


export const createResponse = (packetId, data = null) => {
  // 패킷 ID로 메시지 타입 가져오기
  const messageType = getProtoMessagesById(packetId);

  if (!messageType) {
    throw new Error(`지원되지 않는 PacketId입니다: ${packetId}`);
  }

  // PacketData 인코딩
  let packetData;
  try {
    packetData = messageType.encode(data).finish();
  } catch (error) {
    console.error('인코딩 실패:', error);
    throw error;
  }

  // PacketSize 계산 (PacketId 포함)
  const packetSize = PACKET_SIZE_LENGTH + PACKET_ID_LENGTH + packetData.length; // PacketSize(4 byte) + PacketId(1 byte) + PacketData

  // PacketSize를 빅 엔디안으로 씀
  const packetSizeBuffer = Buffer.alloc(PACKET_SIZE_LENGTH);
  packetSizeBuffer.writeUInt32BE(packetSize, 0); // 빅 엔디안

  // PacketId 씀
  const packetIdBuffer = Buffer.alloc(PACKET_ID_LENGTH);
  packetIdBuffer.writeUInt8(packetId, 0);

  // 패킷 조립
  const responseBuffer = Buffer.concat([packetSizeBuffer, packetIdBuffer, packetData]);

  return responseBuffer;
};
