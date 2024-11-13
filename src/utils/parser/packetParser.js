// src/utils/parser/packetParser.js

import { protoMessagesById } from '../utils/protoUtils.js'; // packetId로 메시지 타입을 가져오는 함수

export const packetParser = (packetId, data) => {
  // 프로토 메시지 타입 가져오기
  const messageType = protoMessagesById(packetId);

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
