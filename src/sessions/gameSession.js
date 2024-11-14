// src/sessions/game.session.js

import Game from '../classes/models/gameClass.js';
import { dungeonSessions } from './sessions.js';

export const addGameSession = (id) => {
  const session = new Game(id);
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

export const getGameSessionById = (id) => {
  const game = dungeonSessions.find((game) => game.id === id);
  if (!game) {
    console.error('gameRoom not found');
  }
  return game;
};