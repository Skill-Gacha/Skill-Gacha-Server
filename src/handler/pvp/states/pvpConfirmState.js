// src/handler/pvp/states/pvpConfirmState.js

import PvpState from './pvpState.js';
import PvpFleeMessageState from './pvpFleeMessageState.js';
import PvpActionState from './pvpActionState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { CONFIRM_TYPE, PVP_STATUS } from '../../../constants/battle.js';

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

    const confirmBattlelogResponse = createResponse(PacketType.S_PvpBattleLog, { battleLog });
    this.mover.socket.write(confirmBattlelogResponse);
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
