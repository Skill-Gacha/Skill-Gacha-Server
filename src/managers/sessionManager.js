// src/managers/sessionManager.js

import Town from '../classes/models/townClass.js';
import Dungeon from '../classes/models/dungeonClass.js';
import PvpRoomClass from '../classes/models/pvpRoomClass.js';
import { MAX_PLAYER } from '../constants/pvp.js';
import logger from '../utils/log/logger.js';
import BossRoomClass from '../classes/models/bossRoomClass.js';

class SessionManager {
  constructor() {
    logger.info(`세션 관리자 생성`);
    this.sessions = {
      town: new Town(10000),
      dungeons: new Map(),
      pvpRooms: new Map(),
      bossRooms: new Map(),
    };
    this.acceptQueue = [];
    this.pvpMatchingQueue = [];
    this.bossMatchingQueue = [];
    this.users = new Map(); // userId -> user
    this.socketToUser = new Map(); // socket -> user
    this.sessionTimeout = 1800000; // 30분
    this.userTimeout = 1800000; // 30분
    this.cleansingInterval = 60000; // 1분
    this.startCleansingInterval();
  }

  // **사용자 관리**
  addUser(user) {
    logger.info(`유저 ${user.id}가 세션에 추가되었습니다.`);
    this.users.set(user.id, user);
    this.socketToUser.set(user.socket, user); // 소켓 맵에 추가
    this.sessions.town.addUser(user); // 기본적으로 마을 세션에 추가
    user.lastActivity = Date.now();
  }

  removeUser(userId) {
    const user = this.users.get(userId);
    if (!user) {
      logger.info(`사용자 ${userId}를 찾을 수 없습니다.`);
      return;
    }

    // 모든 던전 세션에서 사용자 제거
    this.sessions.dungeons.forEach((dungeon) => {
      if (dungeon.removeUser(userId)) {
        logger.info(`던전 세션에서 사용자 ${userId} 제거`);
        // 던전 세션이 비어있다면 클렌징
        if (dungeon.isEmpty()) {
          logger.info(`던전 세션 ${dungeon.id}이 비어있어 제거합니다.`);
          this.removeDungeon(dungeon.id);
        }
      }
    });

    // PvP 방에서 사용자 제거
    this.sessions.pvpRooms.forEach((pvp) => {
      if (pvp.removeUser(userId)) {
        logger.info(`PvP 방 세션에서 사용자 ${userId} 제거`);
        // PvP 방이 비어있다면 클렌징
        if (pvp.isEmpty()) {
          logger.info(`PvP 방 세션 ${pvp.id}이 비어있어 제거합니다.`);
          this.removePvpRoom(pvp.id);
        }
      }
    });

    // 보스 방에서 사용자 제거
    this.sessions.bossRooms.forEach((bossRoom) => {
      if (bossRoom.removeUser(userId)) {
        logger.info(`보스 방 세션에서 사용자 ${userId} 제거`);
        // 보스 방이 비어있다면 클렌징
        if (bossRoom.isEmpty()) {
          logger.info(`보스 방 세션 ${bossRoom.id}이 비어있어 제거합니다.`);
          this.removeBossRoom(bossRoom.id);
        }
      }
    });

    // 마을 세션에서 사용자 제거
    if (this.sessions.town.removeUser(userId)) {
      logger.info(`마을 세션에서 사용자 ${userId} 제거`);
    }

    this.socketToUser.delete(user.socket); // 소켓 맵에서 제거
    this.users.delete(userId);

    logger.info(`사용자 ${userId}가 모든 세션에서 제거되었습니다.`);
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getUserBySocket(socket) {
    const user = this.socketToUser.get(socket);
    if (!user) {
      logger.info('소켓을 찾을 수 없음');
      for (let user of this.users.values()) {
        if (user.socket === socket) {
          return user;
        }
      }
      return null;
    }
    return user;
  }

  // **던전 세션 관리**
  createDungeon(sessionId, dungeonCode) {
    const dungeon = new Dungeon(sessionId, dungeonCode);
    dungeon.lastActivity = Date.now();
    this.sessions.dungeons.set(sessionId, dungeon);

    // 타임아웃 설정
    dungeon.timeout = setTimeout(() => {
      logger.info(`던전 세션 ${sessionId} 타임아웃으로 클렌징`);
      this.removeDungeon(sessionId);
    }, this.sessionTimeout);

    return dungeon;
  }

  getDungeonByUser(user) {
    return this.getSessionByUserId(user.id);
  }

  removeDungeon(sessionId) {
    const dungeon = this.sessions.dungeons.get(sessionId);
    if (dungeon) {
      clearTimeout(dungeon.timeout);
      this.sessions.dungeons.delete(sessionId);
      logger.info(`던전 세션 ${sessionId}이 제거되었습니다.`);
    }
  }

  // **마을 세션 관리**
  getTown() {
    return this.sessions.town;
  }

  // 사용자 세션 조회
  getSessionByUserId(userId) {
    // 유저가 Town에 있으면 Town 세션 반환
    if (this.sessions.town.getUser(userId)) {
      return this.sessions.town;
    }

    // 유저가 Dungeon에 있으면 Dungeon 세션 반환
    for (let dungeon of this.sessions.dungeons.values()) {
      if (dungeon.getUser(userId)) {
        return dungeon;
      }
    }

    // 유저가 PvP에 있으면 PvP 세션 반환
    for (let pvp of this.sessions.pvpRooms.values()) {
      if (pvp.getUser(userId)) {
        return pvp;
      }
    }

    // 유저가 BossRoom에 있으면 BossRoom 세션 반환
    for (let bossRoom of this.sessions.bossRooms.values()) {
      if (bossRoom.getUser(userId)) {
        return bossRoom;
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
          logger.error('패킷 전송 중 오류 발생:', error);
        }
      }
    });
  }

  // **매칭 큐 관리**
  addMatchingQueue(user, maxPlayer = MAX_PLAYER, queueType = 'pvp') {
    const matchingQueue = this.getMatchingQueue(queueType);
    const existingUser = matchingQueue.find((existUser) => existUser.id === user.id);

    if (existingUser) {
      logger.info('이미 매칭중인 유저입니다.');
      return null;
    }

    user.matchingAddedAt = Date.now();
    matchingQueue.push(user);

    if (matchingQueue.length >= maxPlayer && queueType === 'boss') {
      const matchedUsers = matchingQueue.splice(0, maxPlayer);
      this.acceptQueue.push(...matchedUsers);
      return matchedUsers;
    }

    if (matchingQueue.length >= maxPlayer) {
      const matchedUsers = matchingQueue.splice(0, maxPlayer);
      // 매칭된 유저들에 대한 추가 로직 (PvP 방 생성 등)을 여기에 추가할 수 있습니다.
      return matchedUsers;
    }

    return null;
  }

  removeMatchingQueue(user, queueType = 'pvp') {
    const matchingQueue = this.getMatchingQueue(queueType);
    const userIndex = matchingQueue.findIndex((u) => u.id === user.id);

    if (userIndex !== -1) {
      matchingQueue.splice(userIndex, 1);
      logger.info('매칭큐에서 유저를 지웠습니다.');
      return true;
    }
    logger.info('매칭큐에 유저가 존재하지 않습니다.');
    return false;
  }

  removeAcceptQueueInUser(user) {
    const userIndex = this.acceptQueue.findIndex((u) => u.id === user.id);

    if (userIndex !== -1) {
      this.acceptQueue.splice(userIndex, 1);
      logger.info('AcceptQueue에서 유저를 지웠습니다.');
      return true;
    }
    logger.info('AcceptQueue에 유저가 존재하지 않습니다.');
    return false;
  }

  getMatchingQueue(queueType) {
    if (queueType === 'boss') {
      return this.bossMatchingQueue;
    } else if (queueType === 'pvp') {
      return this.pvpMatchingQueue;
    } else {
      logger.error(`유효하지 않은 큐 타입: ${queueType}`);
      return [];
    }
  }

  getAcceptQueue() {
    return this.acceptQueue;
  }

  getPvpByUser(user) {
    for (let pvp of this.sessions.pvpRooms.values()) {
      if (pvp.getUser(user.id)) {
        return pvp;
      }
    }
    return null;
  }

  getBossRoomByUser(user) {
    for (let bossRoom of this.sessions.bossRooms.values()) {
      if (bossRoom.getUser(user.id)) {
        return bossRoom;
      }
    }
    return null;
  }

  createPvpRoom(sessionId) {
    const pvpRoom = new PvpRoomClass(sessionId);
    pvpRoom.lastActivity = Date.now();
    this.sessions.pvpRooms.set(sessionId, pvpRoom);

    // 타임아웃 설정
    pvpRoom.timeout = setTimeout(() => {
      logger.info(`PvP 방 세션 ${sessionId} 타임아웃으로 클렌징`);
      this.removePvpRoom(sessionId);
    }, this.sessionTimeout);

    return pvpRoom;
  }

  removePvpRoom(sessionId) {
    const pvpRoom = this.sessions.pvpRooms.get(sessionId);
    if (pvpRoom) {
      clearTimeout(pvpRoom.timeout);
      this.sessions.pvpRooms.delete(sessionId);
      logger.info(`PvP 방 세션 ${sessionId}이 제거되었습니다.`);
    }
  }

  createBossRoom(sessionId) {
    const bossRoom = new BossRoomClass(sessionId);
    bossRoom.lastActivity = Date.now();
    this.sessions.bossRooms.set(sessionId, bossRoom);
    return bossRoom;
  }

  removeBossRoom(sessionId) {
    const bossRoom = this.sessions.bossRooms.get(sessionId);
    if (bossRoom) {
      clearTimeout(bossRoom.timeout);
      this.sessions.bossRooms.delete(sessionId);
      logger.info(`보스 방 세션 ${sessionId}이 제거되었습니다.`);
    }
  }

  // **세션 클렌징 로직**
  startCleansingInterval() {
    setInterval(() => {
      const now = Date.now();

      // 던전 세션 클렌징
      this.sessions.dungeons.forEach((dungeon, sessionId) => {
        if (now - dungeon.lastActivity > this.sessionTimeout) {
          logger.info(`던전 세션 ${sessionId} 클렌징`);
          this.removeDungeon(sessionId);
        }
      });

      // PvP 방 클렌징
      this.sessions.pvpRooms.forEach((pvp, sessionId) => {
        if (now - pvp.lastActivity > this.sessionTimeout) {
          logger.info(`PvP 방 세션 ${sessionId} 클렌징`);
          this.removePvpRoom(sessionId);
        }
      });

      // 보스 방 클렌징
      this.sessions.bossRooms.forEach((bossRoom, sessionId) => {
        if (now - bossRoom.lastActivity > this.sessionTimeout) {
          logger.info(`보스 방 세션 ${sessionId} 클렌징`);
          this.removeBossRoom(sessionId);
        }
      });

      // 사용자 클렌징
      this.users.forEach((user, userId) => {
        if (now - user.lastActivity > this.userTimeout) {
          logger.info(`사용자 ${userId} 클렌징`);
          this.removeUser(userId);
        }
      });

      // 매칭 큐 클렌징
      ['pvp', 'boss'].forEach((queueType) => {
        const matchingQueue = this.getMatchingQueue(queueType);
        const originalLength = matchingQueue.length;
        this.matchingQueue = matchingQueue.filter((user) => {
          if (now - user.matchingAddedAt > this.userTimeout) {
            logger.info(`매칭 큐에서 사용자 ${user.id} 제거`);
            return false;
          }
          return true;
        });
        if (matchingQueue.length !== originalLength) {
          logger.info(`${queueType.toUpperCase()} 매칭 큐 클렌징 완료`);
        }
      });
    }, this.cleansingInterval);
  }

  // 사용자 활동 시 타이머 갱신
  handleUserActivity(userId) {
    const session = this.getSessionByUserId(userId);
    if (session) {
      session.lastActivity = Date.now();
    }
    const user = this.getUser(userId);
    if (user) {
      user.lastActivity = Date.now();
    }
  }
}

export default SessionManager;
