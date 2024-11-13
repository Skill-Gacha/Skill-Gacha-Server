// src/server.js

import net from 'net';
import { HOST, PORT } from './constants/env.js';
import initServer from './init/index.js';
import { onConnection } from './events/onConnection.js';

const server = net.createServer(onConnection);

const startServer = async () => {
  try {
    await initServer();
    server.listen(PORT, HOST, () => {
      console.log(`서버가 ${HOST}:${PORT}에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();


