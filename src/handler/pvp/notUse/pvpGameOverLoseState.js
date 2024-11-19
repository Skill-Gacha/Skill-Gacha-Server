import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpState from '../states/pvpState.js';

export default class PvpGameOverLoseState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.GAME_OVER_LOSE;

    // 패배 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '당신은 패배하였습니다...',
          typingAnimation: true,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === 0) {
      // 던전 종료 및 세션 제거
      sessionManager.removePvpRoom(this.pvpRoom.sessionId);
      const sLeavePvpResponse = createResponse(PacketType.S_LeaveDungeon, {});
      this.socket.write(sLeavePvpResponse);
    } else {
      // 잘못된 입력 처리
    }
  }
}
