// src/sessions/user.session.js

import { townSession } from './sessions.js';

export const addUserAtTown = async (user) => {
  townSession.addUser(user);
  console.log(townSession);
};

export const getUserByUserId = (userId) => {
  return townSession.users.find((user) => user.id === userId);
};

export const removeUser = async (userId) => {
  const index = townSession.users.findIndex((user) => user.id === userId);
  if (index !== -1) {
    return townSession.users.splice(index, 1)[0];
  }
};

export const getUserBySocket = async (socket) => {
  const user = townSession.users.find((user) => user.socket === socket);
  if (!user) {
    console.error('User not found');
  }
  return user;
};

export const getAllUser = async () => {
  return townSession;
};

export const getAllUserExceptMyself = async (id) => {
  return townSession.users.filter((user) => user.id !== id);
};

export const findUser = async (username) => {
  const foundUser = townSession.users.find((a) => a.id === username);
  return foundUser;
};
