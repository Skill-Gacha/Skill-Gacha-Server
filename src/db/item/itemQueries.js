// src/db/item/itemQueries.js

export const ITEM_QUERIES = {
  GET_ITEMS_BY_NICKNAME: 'SELECT item_id, count FROM Items WHERE nickname = ?',
  INSERT_OR_UPDATE_ITEM: `
    INSERT INTO Items (nickname, item_id, count)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      count = VALUES(count)
  `,
  DELETE_ITEMS_BY_NICKNAME: 'DELETE FROM Items WHERE nickname = ?',
};
