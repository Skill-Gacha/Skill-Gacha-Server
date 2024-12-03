// src/events/onEnd.js

import { sDespawnHandler } from '../handler/town/sDespawnHandler.js';
import sessionManager from '#managers/sessionManager.js';
import { saveSkillsToDB } from '../db/skill/skillDb.js';
import { saveRatingToDB } from '../db/rating/ratingDb.js';
import { deleteSkillsFromRedis, getSkillsFromRedis } from '../db/redis/skillService.js';
import { getPlayerRatingFromRedis, updatePlayerRating } from '../db/redis/ratingService.js';
import { deleteItemsFromRedis, getItemsFromRedis } from '../db/redis/itemService.js';
import { saveItemToDB } from '../db/item/itemDb.js';
import { createResponse } from '../utils/response/createResponse.js';
import { PacketType } from '../constants/header.js';
import logger from '../utils/log/logger.js';
import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import { handleError } from '../utils/error/errorHandler.js';

export const onEnd = (socket) => async () => {
  logger.info('클라이언트 연결이 종료되었습니다.');

  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    logger.error('onEnd: 유저를 찾을 수 없습니다.');
    return;
  }
  const { nickname, gold, stone } = user;
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
      winner.socket.write(victoryMessage); // 승리 메시지 전송

      // 매칭큐 및 세션 정리
      sessionManager.removeMatchingQueue(user);
      this.pvpRoom.clearTurnTimer();
    } catch (error) {
      logger.error('onEnd: PVP 강제종료 처리중 에러:', error);
    }
  }

  try {
    // DB에 스킬 저장
    const skills = await getSkillsFromRedis(nickname);
    if (skills) {
      await saveSkillsToDB(nickname, skills);
    } else {
      logger.error(`onEnd: ${nickname}의 스킬을 찾을 수 없습니다.`);
    }

    // DB에 레이팅 저장
    const rating = await getPlayerRatingFromRedis(nickname);
    if (rating !== null) {
      await saveRatingToDB(nickname, rating);
    } else {
      logger.error(`onEnd: ${nickname}의 레이팅 정보를 찾을 수 없습니다.`);
    }

    // DB에 아이템 저장
    const items = await getItemsFromRedis(nickname);
    if (items && Array.isArray(items)) {
      for (const item of items) {
        // 각 아이템을 MySQL에 저장
        await saveItemToDB(nickname, item.itemId, item.count);
      }
    } else {
      logger.error(`onEnd: ${nickname}의 아이템 정보를 찾을 수 없습니다.`);
    }

    // DB에 저장이 완료되면 레디스에서도 제거
    await deleteSkillsFromRedis(nickname);
    await deleteItemsFromRedis(nickname);
    logger.info(`onEnd: Redis에서 ${nickname}의 데이터 정리 완료`)
  } catch (error) {
    logger.error(`onEnd: ${nickname} 접속 종료 처리 중 문제 발생.`, error);
    const newCustomeError = new CustomError(ErrorCodes.FAILED_TO_PROCESS_END, error);
    handleError(newCustomeError);
  }

  try {
    // 디스펜스 처리 (타운 세션에만)
    await sDespawnHandler(user);

    // 모든 세션에서 사용자 제거
    sessionManager.removeUser(user.id);

    logger.info(`유저 ${user.id}가 세션에서 제거되었습니다.`);
  } catch (error) {
    console.error('onEnd: 처리 중 오류 발생:', error);
    const newCustomeError = new CustomError(ErrorCodes.FAILED_TO_PROCESS_END, error);
    handleError(newCustomeError);
  }
};
