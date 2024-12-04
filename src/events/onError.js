// src/events/onError.js

import { sDespawnHandler } from '../handler/town/sDespawnHandler.js';
import sessionManager from '#managers/sessionManager.js';
import { getPlayerRatingFromRedis, updatePlayerRating } from '../db/redis/ratingService.js';
import { createResponse } from '../utils/response/createResponse.js';
import { PacketType } from '../constants/header.js';
import logger from '../utils/log/logger.js';
import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import { handleError } from '../utils/error/errorHandler.js';

export const onError = (socket) => async (err) => {
  logger.error('onError: 소켓 에러 발생:', err);

  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    logger.error('onError: 유저를 찾을 수 없습니다.');
    return;
  }
  const pvpRoom = sessionManager.getPvpByUser(user);

  if (pvpRoom) {
    try {
      // 강제 종료한 유저가 패배
      const loser = user;
      const winner = [...pvpRoom.users.values()].find((user) => user.id !== loser.id);

      // 타이머 종료
      pvpRoom.clearTurnTimer();

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

      winner.socket.write(victoryMessage); // 승리 메시지 전송
    } catch (error) {
      logger.error('onError: PVP 강제종료 처리중 에러:', error);
      const newCustomeError = new CustomError(ErrorCodes.FAILED_TO_PROCESS_ERROR, error);
      handleError(newCustomeError);
    }
  }

  const bossRoom = sessionManager.getBossRoomByUser(user);

  if (bossRoom) {
    try {
      // 모든 유저에게 게임오버 메시지 전달
      const users = bossRoom.getUsers();
      const gameOverMessage = createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '탈주자가 생겨 마을로 이동됩니다.',
          typingAnimation: false,
        },
      });

      bossRoom.removeUser(user);
      bossRoom.clearTurnTimer();

      users.forEach((user) => {
        user.socket.write(gameOverMessage);
      });
    } catch (error) {
      console.error('onEnd: BOSS 강제종료 처리중 에러:', error);
    }
  }

  try {
    await sDespawnHandler(user);

    // 모든 세션에서 사용자 제거
    sessionManager.removeUser(user.id);

    logger.info(`onError: 유저 ${user.id}가 세션에서 제거되었습니다.`);
  } catch (error) {
    logger.error('onError: 처리 중 오류 발생:', error);
    const newCustomeError = new CustomError(ErrorCodes.FAILED_TO_PROCESS_ERROR, error);
    handleError(newCustomeError);
  }
};
