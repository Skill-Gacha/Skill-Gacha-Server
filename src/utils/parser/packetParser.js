// src/utils/parser/packetParser.js

import { getProtoMessagesById } from '../../init/loadProto.js';

export const packetParser = (packetId, data) => {
  // 패킷 ID로 메시지 타입 가져오기
  const messageType = getProtoMessagesById(packetId);

  if (!messageType) {
    throw new Error(`지원되지 않는 PacketId입니다: ${packetId}`);
  }


  // 메시지 디코딩
  let messageData;
  try {
    messageData = messageType.decode(data);
  } catch (e) {
    console.error(`PacketId ${packetId} 디코딩 오류:`, e);
    throw e;
  }

  return messageData;
};
