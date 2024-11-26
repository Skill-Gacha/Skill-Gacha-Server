// src/db/log/gameLog.queries.js

export const GAME_LOG_QUERIES = {
  CREATE_ACTION_LOG: 'INSERT INTO gameLogs (handlerId, message) VALUES (?, ?)',
  CREATE_RESULT_LOG: 'INSERT INTO results (hostId, opponentId, hostScore, opponentScore) VALUES (?, ?, ?, ?)',
  UPDATE_HIGH_SCORE: `
      UPDATE users
      SET highScore = ?
      WHERE username = ?
        AND highScore < ?;
  `,
};
