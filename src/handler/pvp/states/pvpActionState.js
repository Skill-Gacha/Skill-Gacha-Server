import PvpConfirmState from './pvpConfirmState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { CONFIRM_TYPE, PVP_STATUS } from '../../../constants/battle.js';
import PvpState from './pvpState.js';
import PvpPlayerAttackState from './pvpPlayerAttackState.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import PvpSkillChoice from './pvpSkillChoiceState.js';

export default class PvpActionState extends PvpState {
  constructor(pvpRoom, mover, stopper) {
    super(pvpRoom, mover, stopper);
  }
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.ACTION;
  }

  async handleInput(responseCode) {
    switch (responseCode) {
      case 1: //스킬
        this.changeState(PvpSkillChoice);
        break;
      case 2: // 아이템
        break;
      case 3: // 기권
        this.changeState(PvpConfirmState);
        await this.pvpRoom.currentState.setConfirm(CONFIRM_TYPE.FLEE, '추하게 빼실겁니까?');
        break;
      default:
        // 잘못된 입력 처리
        invalidResponseCode(this.socket);
        break;
    }
  }
}
