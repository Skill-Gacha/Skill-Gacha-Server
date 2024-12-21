// src/events/onData.js

import { getHandlerByPacketType } from '../handler/index.js';
import { packetParser } from '../utils/parser/packetParser.js';
import { handleError } from '../utils/error/errorHandler.js';
import {
  PACKET_HEADER_LENGTH,
  PACKET_ID_LENGTH,
  PACKET_SIZE_LENGTH,
} from '../constants/constants.js';
import logger from '../utils/log/logger.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import CustomError from '../utils/error/customError.js';

// 큐를 순차 처리하는 함수 추가
async function processPacketQueue(socket) {
  if (socket.packetQueue.isProcessing) return;

  socket.packetQueue.isProcessing = true;
  try {
    while (socket.packetQueue.size() > 0) {
      const { packetId, packetData } = socket.packetQueue.dequeue();

      // 패킷 파싱
      let messageData;
      try {
        messageData = packetParser(packetId, packetData);
      } catch (error) {
        logger.error('onData: 패킷 파싱 중 오류 발생.');
        const newCustomError = new CustomError(ErrorCodes.NO_MATCHED_HANLDER, error);
        handleError(newCustomError);
        continue; // 다음 패킷으로 넘어감
      }

      // 핸들러 찾아서 호출
      const handler = getHandlerByPacketType(packetId);
      if (!handler) {
        logger.error(`onData: 핸들러를 찾을 수 없습니다: PacketId ${packetId}`);
        continue;
      }

      try {
        // 순차 실행을 위해 await
        await handler({ socket, payload: messageData });
      } catch (err) {
        logger.error(`onData: 핸들러 처리 중 에러 발생 (PacketId=${packetId}).`);
        handleError(err);
      }
    }
  } finally {
    socket.packetQueue.isProcessing = false;
  }
}

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
      logger.error('onData: 유효하지 않은 패킷 크기:', packetSize);
      // 버퍼에서 잘못된 부분 제거
      socket.buffer = socket.buffer.slice(offset);
      continue;
    }

    // 아직 전체 패킷이 도착하지 않음
    if (socket.buffer.length < packetSize) {
      break;
    }

    // PacketId 읽기
    const packetId = socket.buffer.readUInt8(offset);
    offset += PACKET_ID_LENGTH;

    // PacketData 추출
    const dataLength =
      packetSize - (PACKET_SIZE_LENGTH + PACKET_ID_LENGTH); // 헤더 제외한 데이터 길이
    const packetData = socket.buffer.slice(offset, offset + dataLength);

    // 다음 패킷을 위해 버퍼 업데이트
    socket.buffer = socket.buffer.slice(packetSize);

    // 수신한 패킷을 큐에 쌓는다.
    socket.packetQueue.enqueue({ packetId, packetData });
  }

  // <<<=== [수정됨] 큐를 순차 처리
  processPacketQueue(socket);
};
