// src/db/rating/ratingQueries.js

export const RATING_QUERIES = {
  GET_RATING_BY_NICKNAME: 'SELECT rating FROM Ratings WHERE nickname = ?',
  SAVE_RATING: `
      INSERT INTO Ratings (nickname, rating, updatedat)
      VALUES (?, ?, CURRENT_TIMESTAMP) ON DUPLICATE KEY
      UPDATE
          rating =
      VALUES (rating), updatedat =
      VALUES (updatedat)
  `,
};
