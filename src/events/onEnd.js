// src/events/onEnd.js

import gameEndRHandler from '../handler/game/gameEnd.handler.js';
import { sendGameOverNotification } from '../handler/notification/gameOver.notification.js';
import { getGameSessionById } from '../sessions/game.session.js';
import { getUserBySocket, removeUser } from '../sessions/user.session.js';

export const onEnd = (socket) => async () => {
  console.log('클라이언트 연결이 종료되었습니다.');
};


