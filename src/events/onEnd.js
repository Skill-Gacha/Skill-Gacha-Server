// src/events/onEnd.js

import { sDespawnHandler } from '../handler/town/sDespawnHandler.js';
import { removeUser } from '../sessions/userSession.js';

export const onEnd = (socket) => async () => {
  console.log('클라이언트 연결이 종료되었습니다.');
  
  sDespawnHandler(socket)
  await removeUser(socket);
};


