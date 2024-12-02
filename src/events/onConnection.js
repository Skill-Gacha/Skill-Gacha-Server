// src/events/onConnection.js

import { onData } from './onData.js';
import { onEnd } from './onEnd.js';
import { onError } from './onError.js';
import logger from '../utils/log/logger.js';

export const onConnection = (socket) => {
  logger.info(`Client connected from: ${socket.remoteAddress}:${socket.remotePort}`);

  socket.buffer = Buffer.alloc(0);

  socket.on('data', onData(socket));
  socket.on('end', onEnd(socket));
  socket.on('error', onError(socket));
};


