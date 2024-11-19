﻿import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpState from './pvpState.js';

export default class PvpFleeMessageState extends PvpState {
  async enter() {
    this.pvp.pvpStatus = PVP_STATUS.FLEE_MESSAGE;

    // 도망 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '전투에서 도망쳤습니다.',
          typingAnimation: true,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === 0) {
      // 던전 종료 및 세션 제거
      //sessionManager.removeDungeon(this.pvp.sessionId);
      //const sLeavePvpResponse = createResponse(PacketType.S_LeaveDungeon, {});
      this.socket.write(sLeavePvpResponse);
    } else {
      // 잘못된 입력 처리
    }
  }
}
