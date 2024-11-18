// src/managers/SessionManager.js

import Town from '../classes/models/townClass.js';
import Dungeon from '../classes/models/dungeonClass.js';

let instance;

class SessionManager {
  constructor() {
    if (instance) {
      console.log(`기존 세션 관리자 인스턴스 반환`);
      return instance;
    }
    console.log(`세션 관리자 생성`);
    this.sessions = {
      town: new Town(10000),
      dungeons: new Map(),
    };
    this.users = new Map();
    SessionManager.instance = this;
    Object.freeze(this);
  }

  // **사용자 관리**
  addUser(user) {
    console.log(`유저 ${user.id}가 세션에 추가되었습니다.`);
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

    console.error('소켓을 찾을 수 없음');
    return null;
  }

  // **던전 세션 관리**
  createDungeon(sessionId, dungeonCode) {
    const dungeon = new Dungeon(sessionId, dungeonCode);
    this.sessions.dungeons.set(sessionId, dungeon);
    return dungeon;
  }

  getDungeon(sessionId) {
    return this.sessions.dungeons.get(sessionId);
  }

  getDungeonByUser(user) {
    return this.getSessionByUserId(user.id);
  }

  removeDungeon(sessionId) {
    this.sessions.dungeons.delete(sessionId);
  }

  // **마을 세션 관리**
  getTown() {
    return this.sessions.town;
  }

  // 사용자 세션 조회 (마을 또는 던전)
  // 사용자가 현재 속한 세션을 가져옴
  // 마을에 있으면 타운 세션 정보, 던전에 있으면 던전 세션 정보 가져옴
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
  // 세션에 따라 달라지므로 타운이 될 수도 있고 던전이 될 수도 있음
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