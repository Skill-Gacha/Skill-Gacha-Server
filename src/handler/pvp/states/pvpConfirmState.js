import PvpState from './pvpState.js';
import PvpFleeMessageState from './pvpFleeMessageState.js';
import PvpActionState from './pvpActionState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { CONFIRM_TYPE, PVP_STATUS } from '../../../constants/battle.js';
import sessionManager from '#managers/sessionManager.js';

// 확인 버튼 출력을 위한 부분
export default class PvpConfirmState extends PvpState {
  constructor(pvp, mover, stopper) {
    super(pvp, mover, stopper);
    this.confirmType = CONFIRM_TYPE.DEFAULT;
    this.message = '확인';
  }

  async setConfirm(type, message) {
    this.confirmType = type;
    this.message = message;
    await this.enter();
  }

  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.CONFIRM;
    const buttons = [
      { msg: '예', enable: true },
      { msg: '아니오', enable: true },
    ];

    const battleLog = {
      msg: this.message,
      typingAnimation: false,
      btns: buttons,
    };

    const confirmBattlelogResponse = createResponse(PacketType.S_BattleLog, { battleLog });
    this.mover.write(confirmBattlelogResponse);

    //TODO: S_GameOverNotification 을 수신할 수 있도록 클라이언트 부분 만들기.
    this.mover.write(createResponse(PacketType.S_GameOverNotification, { isWin: false }));
    this.stopper.write(createResponse(PacketType.S_GameOverNotification, { isWin: true }));

    //TODO: Rank 포인트 승자는 점수 높여주고, 패자는 점수 감소시키기

    this.mover.write(createResponse(PacketType.S_LeaveDungeon, {}));
    this.stopper.write(createResponse(PacketType.S_LeaveDungeon, {}));

    sessionManager.removePvpRoom(this.pvpRoom.sessionId);
  }

  async handleInput(responseCode) {
    switch (this.confirmType) {
      case CONFIRM_TYPE.FLEE:
        if (responseCode === 1) {
          // 도망감
          this.changeState(PvpFleeMessageState);
        } else if (responseCode === 2) {
          // 도망 취소
          this.changeState(PvpActionState);
        } else {
          // 잘못된 입력 처리
        }
        break;
      default:
        // 기타 확인 유형 처리
        break;
    }
  }
}
