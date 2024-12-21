// src/handler/pvp/states/confirm/pvpConfirmState.js

import PvpState from '../base/pvpState.js';
import PvpActionState from '../action/pvpActionState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { CONFIRM_TYPE, PVP_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import PvpGameOverState from '../result/pvpGameOverState.js';

const CONFIRM_BUTTONS = [
  { msg: '예', enable: true },
  { msg: '아니오', enable: true },
];

// PvP 확인(Confirm) 상태
export default class PvpConfirmState extends PvpState {
  constructor(pvpRoom, mover, stopper) {
    super(pvpRoom, mover, stopper);
    this.confirmType = CONFIRM_TYPE.DEFAULT;
    this.message = '확인';
  }

  enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.CONFIRM;

    const battleLog = {
      msg: this.message,
      typingAnimation: false,
      btns: CONFIRM_BUTTONS,
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));
  }

  async handleInput(responseCode) {
    switch (this.confirmType) {
      case CONFIRM_TYPE.FLEE:
        if (responseCode === 1) {
          // 도망 확정 시 턴 반전하여 상대를 승자로 처리
          [this.mover, this.stopper] = [this.stopper, this.mover];
          this.changeState(PvpGameOverState);
        } else if (responseCode === 2) {
          this.changeState(PvpActionState);
        } else {
          invalidResponseCode(this.mover.socket);
        }
        break;
      default:
        invalidResponseCode(this.mover.socket);
        break;
    }
  }

  async setConfirm(type, message) {
    this.confirmType = type;
    this.message = message;
    this.enter();
  }
}
