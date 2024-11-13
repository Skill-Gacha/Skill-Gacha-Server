// src/events/onData.js

import { getHandlerByPacketType } from '../handler/index.js';
import { packetParser } from '../utils/parser/packetParser.js';
import { handleError } from '../utils/error/errorHandler.js';
import {PACKET_HEADER_LENGTH, PACKET_ID_LENGTH, PACKET_SIZE_LENGTH} from "../constants/constants.js";

export const onData = (socket) => (data) => {
  // 소켓 버퍼 초기화
  if (!socket.buffer) {
    socket.buffer = Buffer.alloc(0);
  }

  // 받은 데이터를 버퍼에 추가
  socket.buffer = Buffer.concat([socket.buffer, data]);

  while (true) {
    // 버퍼 길이가 최소 패킷 크기(4바이트 PacketSize + 1바이트 PacketId) 이상인지 확인
    if (socket.buffer.length < PACKET_HEADER_LENGTH) {
      // PacketSize와 PacketId를 읽을 수 있을 만큼 데이터가 없음
      break;
    }

    let offset = 0;

    // PacketSize 읽기 (리틀 엔디안)
    const packetSize = socket.buffer.readUInt32LE(offset);
    offset += PACKET_SIZE_LENGTH;

    // 유효성 검사
    if (packetSize <= 0) {
      console.error('유효하지 않은 패킷 크기:', packetSize);
      // 버퍼에서 잘못된 부분 제거
      socket.buffer = socket.buffer.slice(offset);
      continue;
    }

    // 전체 패킷이 도착했는지 확인
    const totalPacketLength = PACKET_SIZE_LENGTH + packetSize; // PacketSize(4 bytes) + packetSize
    if (socket.buffer.length < totalPacketLength) {
      // 아직 전체 패킷이 도착하지 않음
      break;
    }

    // PacketId 읽기
    const packetId = socket.buffer.readUInt8(offset);
    offset += PACKET_ID_LENGTH;

    // PacketData 추출
    const dataLength = packetSize - PACKET_ID_LENGTH; // PacketId 제외한 데이터 길이
    const packetData = socket.buffer.slice(offset, offset + dataLength);

    // 다음 패킷을 위해 버퍼 업데이트
    socket.buffer = socket.buffer.slice(totalPacketLength);

    try {
      // PacketData를 파싱
      const messageData = packetParser(packetId, packetData);

      // 패킷 ID에 해당하는 핸들러 가져오기
      const handler = getHandlerByPacketType(packetId);

      if (handler) {
        handler({ socket, payload: messageData });
      } else {
        console.error(`핸들러를 찾을 수 없습니다: PacketId ${packetId}`);
      }
    } catch (e) {
      handleError(socket, e);
    }
  }
};
