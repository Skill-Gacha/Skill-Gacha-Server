// src/handler/boss/cBossMatchHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { MAX_PLAYER } from '../../constants/boss.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';
import logger from '../../utils/log/logger.js';
import QueueManager from '#managers/queueManager.js';

export const cBossMatchHandler = async ({ socket, payload }) => {
  const sessionManager = serviceLocator.get(SessionManager);
  const queueManager = serviceLocator.get(QueueManager);
  const user = sessionManager.getUserBySocket(socket);
  const { isIn } = payload;

  if (!user) {
    logger.error('cBossMatchHandler: 유저가 존재하지 않습니다.');
    return;
  }

  try {
    if (isIn) {
      const matchedPlayers = await queueManager.addMatchingQueue(user, MAX_PLAYER, 'boss');
      if (!matchedPlayers) {
        logger.info('매칭 대기 중입니다.');
        return;
      }

      const matchedUsers = matchedPlayers
        .map(({ id }) => sessionManager.getUser(id))
        .filter((u) => u !== undefined && u !== null);

      // 매칭된 사용자들 큐에서 제거 및 매칭 상태 해제
      await Promise.all(
        matchedUsers.map(async (u) => {
          u.socket.write(createResponse(PacketType.S_AcceptRequest, {}));
        })
      );
    } else {
      await queueManager.removeMatchingQueue(user, 'boss');
      user.setMatched(false);
    }
  } catch (error) {
    logger.error('cBossMatchHandler: 잘못된 payload 값입니다.', error);
  }
};
