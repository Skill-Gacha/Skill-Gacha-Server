// src/db/user/user.queries.js

export const USER_QUERIES = {
  FIND_USER_BY_NICKNAME: 'SELECT * FROM characterInfo WHERE nickname = ?',
  CREATE_USER:
    'INSERT INTO characterInfo (nickname, job, level, maxHp, maxMp, atk, def, magic, speed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  UPDATE_USER_LOGIN: 'UPDATE characterInfo SET updateAt = CURRENT_TIMESTAMP WHERE username = ?',
};
