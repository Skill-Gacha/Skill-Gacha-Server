// src/sessions/game.session.js

import { dungeonSessions, townSession } from './sessions.js';
import BaseSession from '../classes/models/baseClass.js';

export const addGameSession = (id) => {
  const session = new BaseSession(id);
  dungeonSessions.push(session);
  return session;
};

export const removeGameSession = (id) => {
  const index = dungeonSessions.findIndex((session) => session.id === id);
  if (index !== -1) {
    dungeonSessions.splice(index, 1);
  }
};

export const getGameSession = () => {
  return dungeonSessions;
};

export const getTownSession = () => {
  return townSession;
};

export const getGameSessionById = (id) => {
  const game = dungeonSessions.find((game) => game.id === id);
  if (!game) {
    console.error('gameRoom not found');
  }
  return game;
};
