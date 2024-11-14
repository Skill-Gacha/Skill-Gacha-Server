// src/sessions/user.session.js

import { userSessions } from './sessions.js';

export const addUser = async (user) => {
  userSessions.push(user);
  return user;
};

export const getUserByUserId = (userId) => {
  return userSessions.find((user) => user.userId === userId);
};

export const removeUser = async (socket) => {
  const index = userSessions.findIndex((user) => user.socket === socket);
  if (index !== -1) {
    return userSessions.splice(index, 1)[0];
  }
};

export const getUserBySocket = async (socket) => {
  const user = userSessions.find((user) => user.socket === socket);
  if (!user) {
    console.error('User not found');
  }
  return user;
};

export const getAllUser = async () => {
  return userSessions;
};

export const findUser = async (username) => {
  const foundUser = userSessions.find((a) => a.id === username);
  return foundUser;
};
