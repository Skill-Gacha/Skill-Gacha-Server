import sessionManager from '#managers/sessionManager.js';
import PvpState from '../states/pvpState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';

export default class PvpGameOverWinState extends PvpState {
  async enter() {
    this.pvp.PvpState = PVP_STATUS.GAME_OVER_WIN;

    // 승리 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '당신은 승리하였습니다',
          typingAnimation: true,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === 0) {
      // ScreenText기 때문에 0을 받아야 함
      // 예시) 점수 증가 로직 ?
      // this.pvp.score += 100;

      // 던전 종료 및 세션 제거
      sessionManager.removePvpRoom(this.pvp.sessionId);
      const sLeavePvpResponse = createResponse(PacketType.S_LeaveDungeon, {});
      this.socket.write(sLeavePvpResponse);
    } else {
      // 잘못된 입력 처리
    }
  }
}
