// src/db/skill/skillQueries.js

export const SKILL_QUERIES = {
  GET_SKILLS_BY_NICKNAME: 'SELECT skill1, skill2, skill3, skill4 FROM Skills WHERE nickname = ?',
  SAVE_SKILLS: `
        INSERT INTO Skills (nickname, skill1, skill2, skill3, skill4)
        VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY
        UPDATE
            skill1 =
        VALUES (skill1), skill2 =
        VALUES (skill2), skill3 =
        VALUES (skill3), skill4 =
        VALUES (skill4)
    `,
};
