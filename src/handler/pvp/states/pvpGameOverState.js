// src/handler/pvp/states/pvpGameOverState.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpState from './pvpState.js';
import { getPlayerRatingFromRedis, updatePlayerRating } from '../../../db/redis/ratingService.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';

const POINT_CHANGE = 10;

export default class PvpGameOverState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.GAME_OVER;

    try {
      const [winnerRating, loserRating] = await Promise.all([
        getPlayerRatingFromRedis(this.mover.nickname),
        getPlayerRatingFromRedis(this.stopper.nickname),
      ]);

      await Promise.all([
        updatePlayerRating(this.mover.nickname, winnerRating + POINT_CHANGE),
        updatePlayerRating(this.stopper.nickname, loserRating - POINT_CHANGE),
      ]);
    } catch (error) {
      console.error('pvpGameOverState: 랭크 점수 업데이트 중 오류 발생:', error);
      invalidResponseCode(this.mover.socket);
      return;
    }

    const victoryMessage = createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '게임에서 승리하여 랭크점수 10점 획득하였습니다.',
        typingAnimation: false,
      },
    });

    const defeatMessage = createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '게임에서 패배하여 랭크점수 10점 감소하였습니다.',
        typingAnimation: false,
      },
    });

    this.mover.socket.write(victoryMessage);
    this.stopper.socket.write(defeatMessage);
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
