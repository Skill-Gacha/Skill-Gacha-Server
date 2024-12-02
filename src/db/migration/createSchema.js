// src/db/migration/createSchema.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dbPool from '../database.js';
import logger from '../../utils/log/logger.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handleError } from '../../utils/error/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createSchemas = async () => {
  const sqlDir = path.join(__dirname, '../sql');

  try {
    const sql = fs.readFileSync(path.join(sqlDir, 'user_db.sql'), 'utf8');

    const queries = sql
      .split(';')
      .map((query) => query.trim())
      .filter((query) => query.length > 0);

    for (const query of queries) {
      await dbPool.query(query);
    }
    logger.info('createSchema: 마이그레이션이 완료되었습니다.');
  } catch (error) {
    logger.error('createSchema: 데이터베이스 마이그레이션 에러:');
    const error = new CustomError(ErrorCodes.MIGRATION_FAILED, '마이그레이션 진행 중 오류');
    handleError(error);
  }
};

createSchemas();
