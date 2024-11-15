// src/sessions/dungeonSession.js

import Dungeon from '../classes/models/dungeonClass.js';
import { dungeonSessions } from './sessions.js';

export const addDungeonSession = (sessionId, dungeonCode) => {
  const session = new Dungeon(sessionId, dungeonCode);
  dungeonSessions.push(session);
  return session;
};

export const removeDungeonSession = (sessionId) => {
  const index = dungeonSessions.findIndex((session) => session.sessionId === sessionId);
  if (index !== -1) {
    dungeonSessions.splice(index, 1);
  }
};

export const getDungeonSession = () => {
  return dungeonSessions;
};

export const getDungeonSessionById = (sessionId) => {
  const dungeonSession = dungeonSessions.find((session) => session.sessionId === sessionId);
  if (!game) {
    console.error('dungeonSession not found');
  }
  return dungeonSession;
};

export const getDungeonSessionByUser = (userId) => {
  return dungeonSessions.find((session) => {
    const findUser = session.getDungeonAtUser(userId);
    console.log('유저 찾았다', findUser);
    if (findUser) return session;
  });
};
