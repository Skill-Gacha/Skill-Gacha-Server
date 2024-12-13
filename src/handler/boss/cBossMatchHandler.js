// src/handler/boss/cBossMatchHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { MAX_PLAYER } from '../../constants/boss.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';
import logger from '../../utils/log/logger.js';
import QueueManager from '#managers/queueManager.js';
import AsyncLock from 'async-lock';

const matchHandlerLock = new AsyncLock();

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
    await matchHandlerLock.acquire('cBossMatchHandler', async () => {
      if (isIn) {
        const matchedResult = await queueManager.addMatchingQueue(user, MAX_PLAYER, 'boss');
        if (!matchedResult) {
          logger.info('매칭 대기 중입니다.');
          return;
        }

        const { groupId, userIds } = matchedResult;

        // 매칭된 유저들에게 수락 요청 전송
        const partyList = userIds.map((id) => {
          const u = sessionManager.getUser(id);
          return u ? { id: u.id, status: 'waiting' } : null;
        }).filter(u => u !== null);

        const response = createResponse(PacketType.S_AcceptRequest, {
          // 클라이언트 측에서는 sessionId를 알 필요가 없으므로 패킷에 포함하지 않습니다.
          partyList,
          message: '보스 매칭 요청이 왔습니다. 수락하시겠습니까?',
        });

        await Promise.all(
          userIds.map(async (uid) => {
            const u = sessionManager.getUser(uid);
            if (u) {
              u.socket.write(response);
            }
          })
        );
      } else {
        await queueManager.removeMatchingQueue(user, 'boss');
        user.setMatched(false);
      }
    });
  } catch (error) {
    logger.error('cBossMatchHandler: 잘못된 payload 값입니다.', error);
  }
};
