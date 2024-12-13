// src/utils/db/testConnection.js

import dbPool from '../../db/database.js';
import logger from '../log/logger.js';
import CustomError from '../error/customError.js';
import { ErrorCodes } from '../error/errorCodes.js';

// DB 테스트 커넥션
const testConnection = async () => {
  try {
    const [rows] = await dbPool.query(`SELECT 1 + 1 AS solution`);
    logger.info(`테스트 쿼리 결과: ${rows[0].solution}`);
  } catch (e) {
    throw new CustomError(ErrorCodes.DB_TEST_QUERY_FAILED, 'testConnection: 테스트 쿼리 실행 오류');
  }
};

export default testConnection;
