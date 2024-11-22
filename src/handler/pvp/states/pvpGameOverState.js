// src/handler/pvp/states/pvpGameOverState.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpState from './pvpState.js';
import { getPlayerRatingFromRedis, updatePlayerRating } from '../../../db/redis/ratingService.js';

export default class PvpGameOverState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.GAME_OVER;
    // // 양쪽 유저 랭크 조회
    // const winnerRating = getPlayerRatingFromRedis(this.mover.nickname);
    // const loserRating = getPlayerRatingFromRedis(this.stopper.nickname);

    // // 양쪽 유저 랭크 업데이트
    // updatePlayerRating(this.mover.nickname, winnerRating);
    // updatePlayerRating(this.stopper.nickname, loserRating);

    // 승리 메시지 전송
    this.mover.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '게임에서 승리하여 랭크점수 10점 획득하였습니다.',
          typingAnimation: false,
        },
      }),
    );

    // 패배 메시지 전송
    this.stopper.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '게임에서 패배하여 랭크점수 10점 감소하였습니다.',
          typingAnimation: false,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
    if (responseCode === 0) {
      // PVP 종료 및 세션 제거
      sessionManager.removePvpRoom(this.pvpRoom.sessionId);
      const sLeavePvpResponse = createResponse(PacketType.S_LeaveDungeon, {});
      this.mover.socket.write(sLeavePvpResponse);
      this.stopper.socket.write(sLeavePvpResponse);
    } else {
      // 잘못된 입력 처리
    }
  }
}
