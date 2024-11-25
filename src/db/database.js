// src/db/database.js

import mysql from 'mysql2/promise';
import { dbConfig } from '../config/dbConfig.js';

const createPool = () => {
  const pool = mysql.createPool({
    ...dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
};

const dbPool = createPool();

export default dbPool;
