// src/classes/models/baseSession.js

class BaseSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.users = new Map();
  }

  addUser(user) {
    this.users.set(user.id, user);
  }

  removeUser(userId) {
    this.users.delete(userId);
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getOpponentUsers(userId) {
    return this.users.filter((user) => user.id !== userId);
  }
  getUsers() {
    return this.users;
  }
}

export default BaseSession;
