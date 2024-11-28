// src/handler/pvp/states/pvpFleeMessageState.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpState from './pvpState.js';
import { getPlayerRatingFromRedis, updatePlayerRating } from '../../../db/redis/ratingService.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';

export default class PvpFleeMessageState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.FLEE_MESSAGE;

    try {
      const [winnerRating, loserRating] = await Promise.all([
        getPlayerRatingFromRedis(this.stopper.nickname),
        getPlayerRatingFromRedis(this.mover.nickname),
      ]);

      await Promise.all([
        updatePlayerRating(this.stopper.nickname, winnerRating + 10),
        updatePlayerRating(this.mover.nickname, loserRating - 10),
      ]);
    } catch (error) {
      console.error('pvpFleeMessageState: 랭크 점수 업데이트 중 오류 발생:', error);
    }

    const fleeMessageMover = createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '전투에서 도망쳐 랭크점수 10점 감소하였습니다.',
        typingAnimation: false,
      },
    });

    const fleeMessageStopper = createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '상대방이 전투에서 도망쳐 랭크점수 10점 증가하였습니다.',
        typingAnimation: false,
      },
    });

    this.mover.socket.write(fleeMessageMover);
    this.stopper.socket.write(fleeMessageStopper);
  }

  handleInput(responseCode) {
    if (responseCode === 0) {
      const leaveResponse = createResponse(PacketType.S_LeaveDungeon, {});
      this.mover.socket.write(leaveResponse);
      this.stopper.socket.write(leaveResponse);
      this.pvpRoom.clearTurnTimer();
      sessionManager.removePvpRoom(this.pvpRoom.sessionId);
    } else {
      invalidResponseCode(this.mover.socket);
    }
  }
}
