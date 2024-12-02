// src/managers/sessionManager.js

import Town from '../classes/models/townClass.js';
import Dungeon from '../classes/models/dungeonClass.js';
import PvpRoomClass from '../classes/models/pvpRoomClass.js';
import { MAX_PLAYER } from '../constants/pvp.js';
import logger from '../utils/log/logger.js';

// 싱글톤 클래스
class SessionManager {
  constructor() {
    if (SessionManager.instance) {
      logger.info(`기존 세션 관리자 인스턴스 반환`);
      return SessionManager.instance;
    }
    logger.info(`세션 관리자 생성`);
    this.sessions = {
      town: new Town(10000),
      dungeons: new Map(),
      pvpRooms: new Map(),
    };
    this.matchingQueue = [];
    this.users = new Map();
    SessionManager.instance = this;
    Object.freeze(this);
  }

  // **사용자 관리**
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

    logger.info('소켓을 찾을 수 없음');
    return null;
  }

  // **던전 세션 관리**
  createDungeon(sessionId, dungeonCode) {
    const dungeon = new Dungeon(sessionId, dungeonCode);
    this.sessions.dungeons.set(sessionId, dungeon);
    return dungeon;
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
    // 유저가 Town에 있으면 Town 세션 반환
    if (this.sessions.town.getUser(userId)) {
      return this.sessions.town;
    }

    // 유저가 Dungeon 있으면 Dungeon 세션 반환
    for (let dungeon of this.sessions.dungeons.values()) {
      if (dungeon.getUser(userId)) {
        return dungeon;
      }
    }

    // 유저가 pvp에 있으면 Pvp 세션 반환
    for (let pvp of this.sessions.pvpRooms.values()) {
      if (pvp.getUser(userId)) {
        return pvp;
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
          logger.error('패킷 전송 중 오류 발생:', error);
        }
      }
    });
  }

  // ** 1 대 1 pvp 매칭 관리**
  addMatchingQueue(user) {
    const existingUser = this.matchingQueue.find((existUser) => existUser.id === user.id);

    if (existingUser) {
      logger.info('이미 매칭중인 유저입니다.');
      return;
    }

    this.matchingQueue.push(user);
    if (this.matchingQueue.length === MAX_PLAYER) {
      return this.matchingQueue.splice(0, 2);
    }
    return null;
  }

  removeMatchingQueue(user) {
    const userIndex = this.matchingQueue.findIndex((u) => (u.id === user.id));
    if (userIndex !== -1) {
      this.matchingQueue.splice(userIndex, 1);
      logger.info('매칭큐에서 유저를 지워줍니다');
      return;
    }
    logger.info('매칭큐에 유저가 존재하지 않습니다');
  }

  getPvpByUser(user) {
    for (let pvp of this.sessions.pvpRooms.values()) {
      if (pvp.getUser(user.id)) {
        return pvp;
      }
    }
    return false;
  }

  createPvpRoom(sessionId) {
    const pvpRoom = new PvpRoomClass(sessionId);
    this.sessions.pvpRooms.set(sessionId, pvpRoom);
    return pvpRoom;
  }

  removePvpRoom(sessionId) {
    this.sessions.pvpRooms.delete(sessionId);
  }
}

const sessionManager = new SessionManager();
export default sessionManager;
