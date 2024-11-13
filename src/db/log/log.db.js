// src/db/log/log.db.js

import dbPool from '../database.js';
import { GAME_LOG_QUERIES } from './gameLog.queries.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';

export const createActionLog = async (packetType, message) => {
  await dbPool.query(GAME_LOG_QUERIES.CREATE_ACTION_LOG, [packetType, message]);
};

export const createResultLog = async (hostId, opponentId, hostScore, opponentScore) => {
  const connection = await dbPool.getConnection();
  try {
    // 트랜잭션 시작
    await connection.beginTransaction();

    // 1. results 테이블에 결과 로그 추가
    await connection.query(GAME_LOG_QUERIES.CREATE_RESULT_LOG, [hostId, opponentId, hostScore, opponentScore]);

    // 2. hostId의 하이스코어 갱신
    await connection.query(GAME_LOG_QUERIES.UPDATE_HIGH_SCORE, [hostScore, hostId, hostScore]);

    // 3. opponentId의 하이스코어 갱신
    await connection.query(GAME_LOG_QUERIES.UPDATE_HIGH_SCORE, [opponentScore, opponentId, opponentScore]);

    // 모든 쿼리가 성공하면 커밋
    await connection.commit();
  } catch (error) {
    // 오류 발생 시 롤백
    await connection.rollback();
    throw new CustomError(ErrorCodes.DB_UPDATE_FAILED, error.message);
  } finally {
    // 연결 해제
    connection.release();
  }
};