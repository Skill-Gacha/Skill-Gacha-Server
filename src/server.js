// src/server.js

import net from 'net';
import { HOST, PORT } from './constants/env.js';
import initServer from './init/index.js';
import { onConnection } from './events/onConnection.js';

const server = net.createServer(onConnection);

initServer().then(() => {
    server.listen(PORT, HOST, () => {
        console.log(`서버가 ${HOST}:${PORT}에서 실행 중입니다.`);
    });
}).catch((e) => {
    console.error(e);
    process.exit(1);
});

