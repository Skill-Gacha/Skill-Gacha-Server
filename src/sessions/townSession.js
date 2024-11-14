// src/sessions/user.session.js

import { townSession } from './sessions.js';

export const addUserAtTown = async (user) => {
  townSession.addUser(user);
  return user;
};

export const getUserByUserId = (userId) => {
  return townSession.find((user) => user.userId === userId);
};

export const removeUser = async (socket) => {
  const index = townSession.findIndex((user) => user.socket === socket);
  if (index !== -1) {
    return townSession.splice(index, 1)[0];
  }
};

export const getUserBySocket = async (socket) => {
  const user = townSession.find((user) => user.socket === socket);
  if (!user) {
    console.error('User not found');
  }
  return user;
};

export const getAllUser = async () => {
  return townSession;
};

export const findUser = async (username) => {
  const foundUser = townSession.find((a) => a.id === username);
  return foundUser;
};
