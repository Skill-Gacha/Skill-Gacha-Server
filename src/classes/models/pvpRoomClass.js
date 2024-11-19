import BaseSession from './BaseSession';

// 매칭 큐를 통해 게임이 잡힌 유저 2명의 대한 방
class PvpRoomClass extends BaseSession {
  constructor(pvpId) {
    super(pvpId);
  }
}

export default PvpRoomClass;
