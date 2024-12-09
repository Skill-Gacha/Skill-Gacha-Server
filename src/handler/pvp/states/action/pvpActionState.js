// src/handler/pvp/states/pvpActionState.js

import { CONFIRM_TYPE, PVP_STATUS } from '../../../../constants/battle.js';
import PvpState from '../base/pvpState.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import PvpSkillChoiceState from './pvpSkillChoiceState.js';
import PvpItemChoiceState from './pvpItemChoiceState.js';
import PvpIncreaseManaState from '../turn/pvpIncreaseManaState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import PvpConfirmState from '../confrim/pvpConfirmState.js';

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기', '도망치기'];

export default class PvpActionState extends PvpState {
  enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.ACTION;
    if (this.pvpRoom.gameStart) {
      const battleLog = {
        msg: '행동을 선택해주세요.',
        typingAnimation: false,
        btns: BUTTON_OPTIONS.map((msg) => ({ msg, enable: true })),
      };

      const response = createResponse(PacketType.S_PvpBattleLog, { battleLog });
      this.mover.socket.write(response);
    }
    this.pvpRoom.gameStart = true;
  }

  async handleInput(responseCode) {
    const actionMap = {
      1: PvpSkillChoiceState,
      2: PvpItemChoiceState,
      3: PvpIncreaseManaState,
      4: PvpConfirmState,
    };

    const SelectedState = actionMap[responseCode];
    if (!SelectedState) {
      invalidResponseCode(this.mover.socket);
      return;
    }

    if (SelectedState === PvpConfirmState) {
      this.changeState(SelectedState);
      await this.pvpRoom.currentState.setConfirm(CONFIRM_TYPE.FLEE, '추하게 빼실겁니까?');
    } else {
      this.changeState(SelectedState);
    }
  }
}
