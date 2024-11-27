// src/events/onError.js

import { sDespawnHandler } from '../handler/town/sDespawnHandler.js';
import sessionManager from '#managers/sessionManager.js';

export const onError = (socket) => async (err) => {
  console.error('onError: 소켓 에러 발생:', err);

  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('onError: 유저를 찾을 수 없습니다.');
    return;
  }
  const pvpRoom = sessionManager.getPvpByUser(user);

  if (pvpRoom) {
    try {
      // 강제 종료한 유저가 패배
      const loser = user;
      const winner = [...pvpRoom.users.values()].find((user) => user.id !== loser.id);

      const [winnerRating, loserRating] = await Promise.all([
        getPlayerRatingFromRedis(winner.nickname),
        getPlayerRatingFromRedis(loser.nickname),
      ]);

      await Promise.all([
        updatePlayerRating(winner.nickname, winnerRating + 10),
        updatePlayerRating(loser.nickname, loserRating - 10),
      ]);

      const victoryMessage = createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '게임에서 승리하여 랭크점수 10점 획득하였습니다.',
          typingAnimation: false,
        },
      });
      const defeatMessage = createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '강제 종료로 인해 게임에서 패배하여 랭크점수 10점 감소하였습니다.',
          typingAnimation: false,
        },
      });

      winner.socket.write(victoryMessage); // 승리 메시지 전송
      loser.socket.write(defeatMessage); // 패배 메시지 전송

      // 매칭큐 및 세션 정리
      sessionManager.removeMatchingQueue(user);
      sessionManager.removePvpRoom(pvpRoom.sessionId);
    } catch (error) {
      console.error('onEnd: PVP 강제종료 처리중 에러:', error);
    }
  }

  try {
    await sDespawnHandler(user);

    // 모든 세션에서 사용자 제거
    sessionManager.removeUser(user.id);

    console.log(`onError: 유저 ${user.id}가 세션에서 제거되었습니다.`);
  } catch (error) {
    console.error('onError: 처리 중 오류 발생:', error);
    // 추가적인 에러 핸들링 필요 시 추가
  }
};
