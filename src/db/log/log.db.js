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
    await connection.beginTransaction();

    await connection.query(GAME_LOG_QUERIES.CREATE_RESULT_LOG, [
      hostId,
      opponentId,
      hostScore,
      opponentScore,
    ]);

    await connection.query(GAME_LOG_QUERIES.UPDATE_HIGH_SCORE, [hostScore, hostId, hostScore]);

    await connection.query(GAME_LOG_QUERIES.UPDATE_HIGH_SCORE, [opponentScore, opponentId, opponentScore]);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw new CustomError(ErrorCodes.DB_UPDATE_FAILED, error.message);
  } finally {
    connection.release();
  }
};
