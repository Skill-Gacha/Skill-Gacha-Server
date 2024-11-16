// src/sessions/dungeonSession.js

import Dungeon from '../classes/models/DungeonClass.js';

const dungeonSessions = new Map();

export const addDungeonSession = (dungeonId, dungeonCode) => {
  const dungeon = new Dungeon(dungeonId, dungeonCode);
  dungeonSessions.set(dungeonId, dungeon);
  return dungeon;
};

export const getDungeonSessionByUser = (userId) => {
  for (const dungeon of dungeonSessions.values()) {
    if (dungeon.users.find((user) => user.id === userId)) {
      return dungeon;
    }
  }
  return null;
};

export const removeDungeonSessionByUserId = (userId) => {
  const dungeon = getDungeonSessionByUser(userId);
  if (dungeon) {
    dungeonSessions.delete(dungeon.sessionId); // Assuming sessionId is same as dungeonId
  }
};

export const removeDungeonSessionById = (dungeonId) => {
  dungeonSessions.delete(dungeonId);
};
