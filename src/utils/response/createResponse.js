// src/utils/response/createResponse.js

import { getProtoMessages } from '../../init/loadProto.js';
import {PACKET_ID_LENGTH, PACKET_SIZE_LENGTH} from "../../constants/constants.js";

export const createResponse = (packetId, data = null) => {
  const messageType = protoMessagesById(packetId);

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
  const packetSize = packetData.length + PACKET_ID_LENGTH; // PacketId(1 byte) + PacketData

  // PacketSize를 빅 엔디안으로 쓴다
  const packetSizeBuffer = Buffer.alloc(PACKET_SIZE_LENGTH);
  packetSizeBuffer.writeUInt32BE(packetSize, 0); // 빅 엔디안

  // PacketId를 쓴다
  const packetIdBuffer = Buffer.alloc(PACKET_ID_LENGTH);
  packetIdBuffer.writeUInt8(packetId, 0);

  // 패킷 조립
  const responseBuffer = Buffer.concat([packetSizeBuffer, packetIdBuffer, packetData]);

  return responseBuffer;
};

// packetId를 기반으로 프로토 메시지 타입을 가져오는 함수
const protoMessagesById = (packetId) => {
  const protoMessages = getProtoMessages();
  const MsgIdEnum = protoMessages.MsgId;

  for (const [messageName, id] of Object.entries(MsgIdEnum)) {
    if (id === packetId) {
      return protoMessages[messageName];
    }
  }
  return null;
};
