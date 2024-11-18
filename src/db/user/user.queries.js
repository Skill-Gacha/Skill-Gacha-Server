// src/db/user/user.queries.js

export const USER_QUERIES = {
  FIND_USER_BY_NICKNAME: 'SELECT * FROM CharacterInfo WHERE nickname = ?',
  CREATE_USER:
    'INSERT INTO CharacterInfo (nickname, job, level, maxHp, maxMp, atk, def, magic, speed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  UPDATE_USER_LOGIN: 'UPDATE CharacterInfo SET updateAt = CURRENT_TIMESTAMP WHERE username = ?',
  FIND_USER_MONEY: 'SELECT money FROM CharacterInfo WHERE id = ?',
  UPDATE_USER_MONEY: 'UPDATE CharacterInfo SET money = ? WHERE id = ?',
};
