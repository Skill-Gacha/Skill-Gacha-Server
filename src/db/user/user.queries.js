// src/db/user/user.queries.js

export const USER_QUERIES = {
  FIND_USER_BY_NICKNAME: 'SELECT * FROM Characterinfo WHERE nickname = ?',
  FIND_USER_SIKLL_BY_NICKNAME:
    'SELECT skill1, skill2, skill3, skill4 FROM Skills WHERE nickname = ?',
  CREATE_USER:
    'INSERT INTO Characterinfo (nickname, element, maxhp, maxmp, gold, stone) VALUES (?, ?, ?, ?, ?, ?)',
  CREATE_USER_SKILL_TABLE: 'INSERT INTO Skills (nickname, skill1) VALUES (?, ?)',
  UPDATE_USER_LOGIN: 'UPDATE Characterinfo SET updateAt = CURRENT_TIMESTAMP WHERE nickname = ?',
  GET_ALL_USERNICKNAMES: 'SELECT nickname FROM Characterinfo',
};
