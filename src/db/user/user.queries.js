// src/db/user/user.queries.js

export const USER_QUERIES = {
  FIND_USER_BY_NICKNAME: 'SELECT * FROM users WHERE nickname = ?',
  CREATE_USER:
    'INSERT INTO users (nickname, job, level, maxHp, maxMp, atk, def, magic, speed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  UPDATE_USER_LOGIN: 'UPDATE users SET updateAt = CURRENT_TIMESTAMP WHERE username = ?',
  FIND_HIGH_SCORE: 'SELECT MAX(highScore) AS highScore FROM users',
};
