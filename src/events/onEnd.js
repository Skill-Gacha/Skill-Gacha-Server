// src/events/onEnd.js

import { sDespawnHandler } from '../handler/town/sDespawnHandler.js';
import { removeDungeonSessionByUserId } from '../sessions/dungeonSession.js';
import { getUserBySocket, removeUser } from '../sessions/userSession.js';

export const onEnd = (socket) => async () => {
  console.log('클라이언트 연결이 종료되었습니다.');
  const user = await getUserBySocket(socket);
  removeDungeonSessionByUserId(user.id);
  await sDespawnHandler(socket);
  await removeUser(user.socket);
};
