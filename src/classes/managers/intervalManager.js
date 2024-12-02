// src/classes/managers/intervalManager.js

class IntervalManager {
  constructor() {
    this.intervals = new Map();
  }

  addInterval(userId, callback, timestamp) {
    if (this.intervals.has(userId)) {
      console.error('중복된 인터벌이 확인됩니다');
    }
    this.intervals.set(userId, setInterval(callback, timestamp));
  }

  removeInterval(sessionId) {
    if (!this.intervals.has(sessionId)) {
      return;
    }
    console.log(`Removing interval for session ${sessionId}`);
    clearInterval(this.intervals.get(sessionId));
    this.intervals.delete(sessionId);
  }


  clearAll() {
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });

    this.intervals.clear();
  }
}

export default IntervalManager;