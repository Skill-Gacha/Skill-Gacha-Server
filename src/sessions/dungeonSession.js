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

export const removeDungeonSessionByUserId = (userId) => {
  const findIndex = dungeonSessions.findIndex((session) => session.getDungeonAtUser(userId));
  console.log('찾은 인덱스 : ', findIndex);
  if (findIndex !== -1) dungeonSessions.splice(findIndex, 1);
};

export const getDungeonSessionByUserId = (userId) => {
  return dungeonSessions.find((session) => {
    const findUser = session.getDungeonAtUser(userId);
    if (findUser) return session;
  });
};
