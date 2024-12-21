// src/events/onEnd.js

import { sDespawnHandler } from '../handler/town/sDespawnHandler.js';
import SessionManager from '#managers/sessionManager.js';
import { saveSkillsToDB } from '../db/skill/skillDb.js';
import { saveRatingToDB } from '../db/rating/ratingDb.js';
import {
  deleteSkillsFromRedis,
  getSkillsFromRedis,
} from '../db/redis/skillService.js';
import {
  getPlayerRatingFromRedis,
  updatePlayerRating,
} from '../db/redis/ratingService.js';
import {
  deleteItemsFromRedis,
  getItemsFromRedis,
} from '../db/redis/itemService.js';
import { saveItemToDB } from '../db/item/itemDb.js';
import { createResponse } from '../utils/response/createResponse.js';
import { PacketType } from '../constants/header.js';
import logger from '../utils/log/logger.js';
import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import { handleError } from '../utils/error/errorHandler.js';
import serviceLocator from '#locator/serviceLocator.js';
import QueueManager from '#managers/queueManager.js';

// 트랜잭션 처리를 위해 dbPool 사용
import dbPool from '../db/database.js';

export const onEnd = (socket) => async () => {
  logger.info('클라이언트 연결이 종료되었습니다.');
  const sessionManager = serviceLocator.get(SessionManager);
  const queueManager = serviceLocator.get(QueueManager);

  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    logger.error('onEnd: 유저를 찾을 수 없습니다.');
    return;
  }

  const { nickname } = user;
  const pvpRoom = sessionManager.getPvpByUser(user);

  // --- PVP 처리 ---
  if (pvpRoom) {
    try {
      if ([...pvpRoom.users.values()].length !== 1) {
        // 강제 종료한 유저가 패배
        const loser = user;
        const winner = [...pvpRoom.users.values()].find(
          (usr) => usr.id !== loser.id
        );

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
      }
    } catch (error) {
      logger.error('onEnd: PVP 강제종료 처리중 에러:', error);
    }
  }

  // --- BOSS 처리 ---
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

      users.forEach((usr) => {
        usr.socket.write(gameOverMessage);
      });
    } catch (error) {
      console.error('onEnd: BOSS 강제종료 처리중 에러:', error);
    }
  }

  // 스킬, 레이팅, 아이템 DB 저장을 트랜잭션으로 묶기 ---
  try {
    const connection = await dbPool.getConnection(); // 커넥션 얻기
    try {
      await connection.beginTransaction();

      // 1) Redis에서 스킬 불러와 DB 저장
      const skills = await getSkillsFromRedis(nickname);
      if (skills) {
        await connection.query(
          `INSERT INTO Skills (nickname, skill1, skill2, skill3, skill4)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             skill1 = VALUES(skill1),
             skill2 = VALUES(skill2),
             skill3 = VALUES(skill3),
             skill4 = VALUES(skill4)`,
          [nickname, skills.skill1, skills.skill2, skills.skill3, skills.skill4]
        );
      } else {
        logger.error(`onEnd: ${nickname}의 스킬을 찾을 수 없습니다.`);
      }

      // 2) Redis에서 레이팅 불러와 DB 저장
      const rating = await getPlayerRatingFromRedis(nickname);
      if (rating !== null) {
        await connection.query(
          `INSERT INTO Ratings (nickname, rating, updatedAt)
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON DUPLICATE KEY UPDATE
             rating = VALUES(rating),
             updatedAt = VALUES(updatedAt)`,
          [nickname, rating]
        );
      } else {
        logger.error(`onEnd: ${nickname}의 레이팅 정보를 찾을 수 없습니다.`);
      }

      // Redis에서 아이템 불러와 DB 저장
      const items = await getItemsFromRedis(nickname);
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await connection.query(
            `INSERT INTO Items (nickname, item_id, count)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE count = ?`,
            [nickname, item.itemId, item.count, item.count]
          );
        }
      } else {
        logger.error(`onEnd: ${nickname}의 아이템 정보를 찾을 수 없습니다.`);
      }

      // 모두 성공하면 commit
      await connection.commit();

      // Redis 데이터 삭제
      await deleteSkillsFromRedis(nickname);
      await deleteItemsFromRedis(nickname);
      logger.info(`onEnd: Redis에서 ${nickname}의 데이터 정리 완료`);
    } catch (err) {
      await connection.rollback();
      logger.error(`onEnd: ${nickname} DB 저장 중 문제 발생.`, err);
      const newCustomeError = new CustomError(ErrorCodes.FAILED_TO_PROCESS_END, err);
      handleError(newCustomeError);
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error(`onEnd: ${nickname} 접속 종료 처리 중 문제 발생.`, error);
    const newCustomError = new CustomError(ErrorCodes.FAILED_TO_PROCESS_END, error);
    handleError(newCustomError);
  }

  // --- 마지막으로 세션 정리 ---
  try {
    await sDespawnHandler(user);

    // 모든 세션에서 사용자 제거
    sessionManager.removeUser(user.id);

    // PVP나 보스 매칭큐에서 유저 제거
    queueManager.removeMatchingQueue(user, 'pvp');
    queueManager.removeMatchingQueue(user, 'boss');
    queueManager.removeAcceptQueueInUser(user);

    logger.info(`유저 ${user.id}가 세션에서 제거되었습니다.`);
  } catch (error) {
    console.error('onEnd: 처리 중 오류 발생:', error);
    const newCustomeError = new CustomError(ErrorCodes.FAILED_TO_PROCESS_END, error);
    handleError(newCustomeError);
  }
};
