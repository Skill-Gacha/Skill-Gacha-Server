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
    // 이전에는 matchHandlerLock을 사용했으나 제거함. 대신 queueManager 내부에서 모든 접근 제어.
    // 변경 사항: 직접 pendingGroups Lock 사용 대신, queueManager 호출.
    if (isIn) {
      const matchedResult = await queueManager.addMatchingQueue(user, MAX_PLAYER, 'boss');
      if (!matchedResult) {
        logger.info('매칭 대기 중입니다.');
        return;
      }

      const { userIds } = matchedResult;
      const partyList = userIds.map((id) => {
        const u = sessionManager.getUser(id);
        return u ? { id: u.id, status: 'waiting' } : null;
      }).filter(u => u !== null);

      const response = createResponse(PacketType.S_AcceptRequest, {
        partyList,
        message: '보스 매칭 요청이 왔습니다. 수락하시겠습니까?',
      });

      await Promise.all(
        userIds.map(async (uid) => {
          const u = sessionManager.getUser(uid);
          if (u) {
            u.socket.write(response);
          }
        }),
      );
    } else {
      await queueManager.removeMatchingQueue(user, 'boss');
      user.setMatched(false);
    }
  } catch (error) {
    logger.error('cBossMatchHandler: 잘못된 payload 값입니다.', error);
  }
};
