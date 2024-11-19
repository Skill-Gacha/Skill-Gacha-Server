﻿import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpState from './pvpState.js';

export default class PvpGameOverWinState extends PvpState {
  async enter() {
    this.pvp.PvpState = PVP_STATUS.GAME_OVER_WIN;

    // 승리 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '던전 클리어!',
          typingAnimation: true,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === 0) {
      // ScreenText기 때문에 0을 받아야 함
      // 던전 종료 및 세션 제거
      //sessionManager.removeDungeon(this.dungeon.sessionId);
      //const sLeaveDungeonResponse = createResponse(PacketType.S_LeaveDungeon, {});
      //this.socket.write(sLeaveDungeonResponse);
    } else {
      // 잘못된 입력 처리
    }
  }
}
