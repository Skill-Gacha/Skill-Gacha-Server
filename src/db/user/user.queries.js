// src/db/user/user.queries.js

export const USER_QUERIES = {
  FIND_USER_BY_NICKNAME: 'SELECT * FROM CharacterInfo WHERE nickname = ?',
  CREATE_USER:
    'INSERT INTO CharacterInfo (nickname, element, maxhp, maxmp, gold, stone) VALUES (?, ?, ?, ?, ?, ?)',
  UPDATE_USER_LOGIN: 'UPDATE CharacterInfo SET updateAt = CURRENT_TIMESTAMP WHERE nickname = ?',
  UPDATE_USER_RESOURCE: 'UPDATE CharacterInfo SET gold = ?, stone = ? WHERE nickname = ?',
  GET_ALL_USERNICKNAMES: 'SELECT nickname FROM CharacterInfo',
};
