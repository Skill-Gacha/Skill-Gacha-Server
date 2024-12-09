// src/handler/boss/cBossMatchHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { MAX_PLAYER } from '../../constants/boss.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';
import logger from '../../utils/log/logger.js';

export const cBossMatchHandler = async ({ socket, payload }) => {
  const sessionManager = serviceLocator.get(SessionManager);
  const user = sessionManager.getUserBySocket(socket);
  const { isIn } = payload;

  if (!user) {
    logger.error('cBossMatchHandler: 유저가 존재하지 않습니다.');
    return;
  }

  try {
    if (isIn) {
      // matchedPlayers는 [{id: userId}, ...] 형태
      const matchedPlayers = await sessionManager.addMatchingQueue(user, MAX_PLAYER, 'boss');
      if (!matchedPlayers) return;

      const matchedUsers = matchedPlayers.map(({ id }) => sessionManager.getUser(id));

      matchedUsers.forEach((u) => {
        u.socket.write(createResponse(PacketType.S_AcceptRequest, {}));
      });
    } else {
      sessionManager.removeMatchingQueue(user, 'boss');
    }
  } catch (error) {
    logger.error('cBossMatchHandler: 잘못된 payload 값입니다.', error);
  }
};
