// src/managers/sessionManager.js

import Town from '../classes/models/townClass.js';
import Dungeon from '../classes/models/dungeonClass.js';
import PvpRoomClass from '../classes/models/pvpRoomClass.js';
import { MAX_PLAYER } from '../constants/pvp.js';
import logger from '../utils/log/logger.js';
import BossRoomClass from '../classes/models/bossRoomClass.js';
import Queue from 'bull';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../constants/env.js';

class SessionManager {
  constructor() {
    logger.info(`세션 관리자 생성`);
    this.sessions = {
      town: new Town(10000),
      dungeons: new Map(),
      pvpRooms: new Map(),
      bossRooms: new Map(),
    };

    // Bull 큐 초기화 (유저 ID만 저장)
    this.pvpMatchingQueue = new Queue('pvpMatchingQueue', {
      redis: { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD },
    });
    this.bossMatchingQueue = new Queue('bossMatchingQueue', {
      redis: { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD },
    });

    // 기존 acceptQueue 배열 대신 Bull Queue로 일관성 확보가 필요하다면 여기에 추가 가능.
    // 여기서는 일단 삭제 또는 주석 처리.
    // this.acceptQueue = [];

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
    this.socketToUser.set(user.socket, user);
    this.sessions.town.addUser(user);
    user.lastActivity = Date.now();
  }

  removeUser(userId) {
    const user = this.users.get(userId);
    if (!user) {
      logger.info(`사용자 ${userId}를 찾을 수 없습니다.`);
      return;
    }

    // 모든 던전, PvP, 보스룸에서 사용자 제거
    this.sessions.dungeons.forEach((dungeon) => {
      if (dungeon.removeUser(userId)) {
        logger.info(`던전 세션에서 사용자 ${userId} 제거`);
        if (dungeon.isEmpty()) {
          logger.info(`던전 세션 ${dungeon.id}이 비어있어 제거합니다.`);
          this.removeDungeon(dungeon.id);
        }
      }
    });

    this.sessions.pvpRooms.forEach((pvp) => {
      if (pvp.removeUser(userId)) {
        logger.info(`PvP 방 세션에서 사용자 ${userId} 제거`);
        if (pvp.isEmpty()) {
          logger.info(`PvP 방 세션 ${pvp.id}이 비어있어 제거합니다.`);
          this.removePvpRoom(pvp.id);
        }
      }
    });

    this.sessions.bossRooms.forEach((bossRoom) => {
      if (bossRoom.removeUser(userId)) {
        logger.info(`보스 방 세션에서 사용자 ${userId} 제거`);
        if (bossRoom.isEmpty()) {
          logger.info(`보스 방 세션 ${bossRoom.id}이 비어있어 제거합니다.`);
          this.removeBossRoom(bossRoom.id);
        }
      }
    });

    if (this.sessions.town.removeUser(userId)) {
      logger.info(`마을 세션에서 사용자 ${userId} 제거`);
    }

    this.socketToUser.delete(user.socket);
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
    if (this.sessions.town.getUser(userId)) {
      return this.sessions.town;
    }

    for (let dungeon of this.sessions.dungeons.values()) {
      if (dungeon.getUser(userId)) {
        return dungeon;
      }
    }

    for (let pvp of this.sessions.pvpRooms.values()) {
      if (pvp.getUser(userId)) {
        return pvp;
      }
    }

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

  // **매칭 큐 관리 (유저 ID만 저장)**
  async addMatchingQueue(user, maxPlayer = MAX_PLAYER, queueType = 'pvp') {
    const matchingQueue = this.getMatchingQueue(queueType);
    const waitingJobs = await matchingQueue.getJobs('waiting');
    const existingUser = waitingJobs.find((job) => job.data.id === user.id);

    if (existingUser) {
      logger.info('이미 매칭중인 유저입니다.');
      return null;
    }

    user.matchingAddedAt = Date.now();

    // 유저 ID만 큐에 추가
    await matchingQueue.add({ id: user.id });
    const updateWaitingJobs = await matchingQueue.getJobs('waiting');

    // 매칭 조건 충족 시 유저 ID 목록 반환
    if (updateWaitingJobs.length >= maxPlayer) {
      const matchedJobs = updateWaitingJobs.splice(0, maxPlayer);
      const matchedUserIds = matchedJobs.map((job) => job.data.id);

      await Promise.all(
        matchedJobs.map(async (job) => {
          await job.remove();
        })
      );

      // 여기서는 user 객체를 반환하지 않고, userId 배열을 반환
      return matchedUserIds.map((userId) => ({ id: userId }));
    }

    return null;
  }

  async removeMatchingQueue(user, queueType = 'pvp') {
    const matchingQueue = this.getMatchingQueue(queueType);
    const waitingJobs = await matchingQueue.getJobs('waiting');
    const userJob = waitingJobs.find((job) => job.data.id === user.id);

    if (userJob) {
      await userJob.remove();
      logger.info('매칭큐에서 유저를 지웠습니다.');
      return true;
    }
    logger.info('매칭큐에 유저가 존재하지 않습니다.');
    return false;
  }

  // 필요하다면 acceptQueue도 Bull 큐로 동일하게 관리
  // async removeAcceptQueueInUser(user) {
  //   // 이 부분은 acceptQueue를 Bull로 변경하거나, 필요 없다면 제거
  // }

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

  // PvP, BossRoom 조회 로직은 동일
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
  async startCleansingInterval() {
    setInterval(async () => {
      const now = Date.now();

      this.sessions.dungeons.forEach((dungeon, sessionId) => {
        if (now - dungeon.lastActivity > this.sessionTimeout) {
          logger.info(`던전 세션 ${sessionId} 클렌징`);
          this.removeDungeon(sessionId);
        }
      });

      this.sessions.pvpRooms.forEach((pvp, sessionId) => {
        if (now - pvp.lastActivity > this.sessionTimeout) {
          logger.info(`PvP 방 세션 ${sessionId} 클렌징`);
          this.removePvpRoom(sessionId);
        }
      });

      this.sessions.bossRooms.forEach((bossRoom, sessionId) => {
        if (now - bossRoom.lastActivity > this.sessionTimeout) {
          logger.info(`보스 방 세션 ${sessionId} 클렌징`);
          this.removeBossRoom(sessionId);
        }
      });

      this.users.forEach((user, userId) => {
        if (now - user.lastActivity > this.userTimeout) {
          logger.info(`사용자 ${userId} 클렌징`);
          this.removeUser(userId);
        }
      });

      for (const queueType of ['pvp', 'boss']) {
        const matchingQueue = this.getMatchingQueue(queueType);
        const waitingJobs = await matchingQueue.getJobs('waiting');

        const jobsToRemove = waitingJobs.filter((job) => {
          const { id: uid } = job.data;
          const u = this.getUser(uid);
          if (!u) return true; // 유저가 없으면 제거
          if (now - u.matchingAddedAt > this.userTimeout) {
            logger.info(`매칭 큐에서 사용자 ${uid} 제거`);
            return true;
          }
          return false;
        });

        await Promise.all(jobsToRemove.map((job) => job.remove()));

        if (jobsToRemove.length > 0) {
          logger.info(`${queueType.toUpperCase()} 매칭 큐 클렌징 완료`);
        }
      }
    }, this.cleansingInterval);
  }

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
