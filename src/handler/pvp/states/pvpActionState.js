// src/handler/pvp/states/pvpActionState.js

import PvpConfirmState from './pvpConfirmState.js';
import { CONFIRM_TYPE, PVP_STATUS } from '../../../constants/battle.js';
import PvpState from './pvpState.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import PvpSkillChoice from './pvpSkillChoiceState.js';
import PvpItemChoiceState from './pvpItemChoiceState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';

export default class PvpActionState extends PvpState {
  enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.ACTION;
    if (this.pvpRoom.gameStart) {
      const buttons = [
        { msg: '스킬 사용', enable: true },
        { msg: '아이템 사용', enable: true },
        { msg: '도망치기', enable: true },
      ];

      const battleLog = {
        msg: '행동을 선택해주세요.',
        typingAnimation: false,
        btns: buttons,
      };

      const actionChooseBattlelogResponse = createResponse(PacketType.S_PvpBattleLog, {
        battleLog,
      });
      this.mover.socket.write(actionChooseBattlelogResponse);
    }
    this.pvpRoom.gameStart = true;
  }

  async handleInput(responseCode) {
    switch (responseCode) {
      case 1: //스킬
        this.changeState(PvpSkillChoice);
        break;
      case 2: // 아이템
        this.changeState(PvpItemChoiceState);
        break;
      case 3: // 도망치기
        this.changeState(PvpConfirmState);
        await this.pvpRoom.currentState.setConfirm(CONFIRM_TYPE.FLEE, '추하게 빼실겁니까?');
        break;
      default:
        invalidResponseCode(this.mover.socket);
        break;
    }
  }
}
