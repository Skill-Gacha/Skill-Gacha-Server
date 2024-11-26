// src/utils/db/testConnection.js

import dbPool from '../../db/database.js';

const testConnection = async () => {
  try {
    const [rows] = await dbPool.query(`SELECT 1 + 1 AS solution`);
    console.log(`테스트 쿼리 결과: ${rows[0].solution}`);
  } catch (e) {
    console.error(`testConnection: 테스트 쿼리 실행 오류, `, e);
  }
};

export default testConnection;