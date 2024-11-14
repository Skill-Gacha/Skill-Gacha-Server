// src/events/onError.js

import { sDespawnHandler } from '../handler/town/sDespawnHandler.js';
import { removeUser } from '../sessions/userSession.js';

export const onError = (socket) => async (err) => {
  sDespawnHandler(socket);
  await removeUser(socket);
};