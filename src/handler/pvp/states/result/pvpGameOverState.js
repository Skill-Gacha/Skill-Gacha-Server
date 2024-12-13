// src/handler/pvp/states/result/pvpGameOverState.js

import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../../constants/battle.js';
import PvpState from '../base/pvpState.js';
import { getPlayerRatingFromRedis, updatePlayerRating } from '../../../../db/redis/ratingService.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import logger from '../../../../utils/log/logger.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';
import { RANK_CHANGE_POINTS } from '../../../../constants/pvp.js';

export default class PvpGameOverState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.GAME_OVER;

    this.resetUserBuffs(this.mover);
    this.resetUserBuffs(this.stopper);

    try {
      const [winnerRating, loserRating] = await Promise.all([
        getPlayerRatingFromRedis(this.mover.nickname),
        getPlayerRatingFromRedis(this.stopper.nickname),
      ]);

      await Promise.all([
        updatePlayerRating(this.mover.nickname, winnerRating + RANK_CHANGE_POINTS),
        updatePlayerRating(this.stopper.nickname, loserRating - RANK_CHANGE_POINTS),
      ]);
    } catch (error) {
      logger.error('pvpGameOverState: 랭크 점수 업데이트 중 오류 발생:', error);
      invalidResponseCode(this.mover.socket);
      return;
    }

    this.mover.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '게임에서 승리하여 랭크점수 10점 획득하였습니다.',
          typingAnimation: false,
        },
      }),
    );

    this.stopper.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '게임에서 패배하여 랭크점수 10점 감소하였습니다.',
          typingAnimation: false,
        },
      }),
    );
  }

  handleInput(responseCode) {
    const sessionManager = serviceLocator.get(SessionManager);
    if (responseCode === 0) {
      const leaveResponse = createResponse(PacketType.S_LeaveDungeon, {});
      if (this.pvpRoom) {
        this.mover.socket.write(leaveResponse);
        this.stopper.socket.write(leaveResponse);
        this.pvpRoom.clearTurnTimer();
        sessionManager.removePvpRoom(this.pvpRoom.sessionId);
      }
    } else {
      invalidResponseCode(this.mover.socket);
    }
  }

  resetUserBuffs(user) {
    user.buff = null;
    user.battleCry = false;
    user.stimPack = false;
    user.dangerPotion = false;
    user.protect = false;
    user.downResist = false;
  }
}
