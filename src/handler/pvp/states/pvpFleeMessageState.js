// src/handler/pvp/states/pvpFleeMessageState.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpState from './pvpState.js';

export default class PvpFleeMessageState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.PvpFleeMessageState;
    // 양쪽 유저 랭크 조회
    const winnerRating = getPlayerRatingFromRedis(this.stopper.nickname);
    const loserRating = getPlayerRatingFromRedis(this.mover.nickname);

    // 양쪽 유저 랭크 업데이트
    updatePlayerRating(this.stopper.nickname, winnerRating);
    updatePlayerRating(this.mover.nickname, loserRating);

    // 도망 메시지 전송
    this.mover.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '전투에서 도망쳐 랭크점수 10점 감소하였습니다.',
          typingAnimation: false,
        },
      }),
    );
    this.stopper.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '상대방이 전투에서 도망쳐 랭크점수 10점 증가하였습니다.',
          typingAnimation: false,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === 0) {
      // 던전 종료 및 세션 제거
      sessionManager.removePvpRoom(this.pvp.sessionId);
      const sLeavePvpResponse = createResponse(PacketType.S_LeaveDungeon, {});
      this.mover.socket.write(sLeavePvpResponse);
      this.stopper.socket.write(sLeavePvpResponse);
    } else {
      // 잘못된 입력 처리
    }
  }
}
