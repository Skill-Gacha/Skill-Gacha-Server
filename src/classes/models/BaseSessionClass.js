// src/classes/models/BaseSessionClass.js

class BaseSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.users = [];
  }
}

export default BaseSession;
