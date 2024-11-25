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
}

export default BaseSession;
