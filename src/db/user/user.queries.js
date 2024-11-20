// src/db/user/user.queries.js

export const USER_QUERIES = {
  FIND_USER_BY_NICKNAME: 'SELECT * FROM Characterinfo WHERE nickname = ?',
  CREATE_USER:
    'INSERT INTO Characterinfo (nickname, element, maxhp, maxmp, gold, stone) VALUES (?, ?, ?, ?, ?, ?)',
  UPDATE_USER_LOGIN: 'UPDATE Characterinfo SET updateAt = CURRENT_TIMESTAMP WHERE nickname = ?',
  UPDATE_USER_RESOURCE: 'UPDATE Characterinfo SET gold = ?, stone = ? WHERE nickname = ?',
  GET_ALL_USERNICKNAMES: 'SELECT nickname FROM Characterinfo',
};
