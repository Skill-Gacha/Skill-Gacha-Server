// src/events/onConnection.js

import { onData } from './onData.js';
import { onEnd } from './onEnd.js';
import { onError } from './onError.js';
import logger from '../utils/log/logger.js';

// 큐잉을 위한 클래스
// 왜 글로벌 큐가 아닌가?

// 이 게임은 턴제 게임
// 실시간으로 전투가 이루어지거나 하지 않음
// 실시간 상호작용이라 해 봐야 마을에서의 이동 정도
// 따라서 서버의 규모가 작고 확실한 순서 보장을 위해 소켓 별 큐 사용

// 클러스터링이 없는 단일 노드 환경에서 빠르게 올릴 수 있고,
// 레이스 컨디션 문제도 심플하게 볼 수 있게 해 준다
class PacketQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(item) {
    this.queue.push(item);
  }

  dequeue() {
    return this.queue.shift();
  }

  size() {
    return this.queue.length;
  }
}

export const onConnection = (socket) => {
  logger.info(`Client connected from: ${socket.remoteAddress}:${socket.remotePort}`);

  socket.buffer = Buffer.alloc(0);

  // 소켓마다 패킷 큐 생성
  socket.packetQueue = new PacketQueue();

  socket.on('data', onData(socket));
  socket.on('end', onEnd(socket));
  socket.on('error', onError(socket));
};

