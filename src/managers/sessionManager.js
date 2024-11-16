// src/managers/SessionManager.js


import Town from '../classes/models/townClass.js';
import Dungeon from '../classes/models/dungeonClass.js';

class SessionManager {
  constructor() {
    this.sessions = {
      town: new Town(10000), // 기본 마을 세션 초기화
      dungeons: new Map(),
    };
    this.users = new Map();
  }

  // 사용자 관리
  addUser(user) {
    this.users.set(user.id, user);
    this.sessions.town.addUser(user); // 기본적으로 마을 세션에 추가
  }

  removeUser(userId) {
    this.users.delete(userId);
    // 모든 세션에서 사용자 제거
    this.sessions.dungeons.forEach((dungeon) => dungeon.removeUser(userId));
    this.sessions.town.removeUser(userId);
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getUserBySocket(socket) {
    for (let user of this.users.values()) {
      if (user.socket === socket) {
        return user;
      }
    }
    return null;
  }

  // 던전 세션 관리
  createDungeon(sessionId, dungeonCode) {
    const dungeon = new Dungeon(sessionId, dungeonCode);
    this.sessions.dungeons.set(sessionId, dungeon);
    return dungeon;
  }

  getDungeon(sessionId) {
    return this.sessions.dungeons.get(sessionId);
  }

  removeDungeon(sessionId) {
    this.sessions.dungeons.delete(sessionId);
  }

  // 마을 세션 관리
  getTown() {
    return this.sessions.town;
  }

  // 사용자 세션 조회 (마을 또는 던전)
  getSessionByUserId(userId) {
    if (this.sessions.town.getUser(userId)) {
      return this.sessions.town;
    }
    for (let dungeon of this.sessions.dungeons.values()) {
      if (dungeon.getUser(userId)) {
        return dungeon;
      }
    }
    return null;
  }

  // 세션 내 사용자에게 패킷 브로드캐스트
  broadcastToSession(session, packet, excludeUserId = null) {
    session.users.forEach((user) => {
      if (user.id !== excludeUserId) {
        try {
          user.socket.write(packet);
        } catch (error) {
          console.error('패킷 전송 중 오류 발생:', error);
        }
      }
    });
  }
}

const sessionManager = new SessionManager();
export default sessionManager;
