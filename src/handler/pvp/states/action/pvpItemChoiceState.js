// src/handler/pvp/states/pvpItemChoiceState.js

import PvpActionState from './pvpActionState.js';
import PvpState from '../base/pvpState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { MAX_BUTTON_COUNT, PVP_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { getProductData } from '../../../../init/loadAssets.js';
import PvpUseItemState from './pvpUseItemState.js';

export default class PvpItemChoiceState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.ITEM_CHOICE;

    const itemsData = getProductData();
    const itemsName = itemsData.map((itemData) => itemData.name);

    const buttons = this.mover.items.map((item) => ({
      msg: `${itemsName[item.itemId - 4001]}(보유 수량: ${item.count})`,
      enable:
        item.itemId === 4003 ? !this.mover.stat.stimPack && item.count !== 0 : item.count !== 0,
    }));

    buttons.push({
      msg: '뒤로 가기',
      enable: true,
    });

    const battleLog = {
      msg: '사용하실 아이템을 선택해 주세요',
      typingAnimation: false,
      btns: buttons,
    };

    const choiceItemBattlelogResponse = createResponse(PacketType.S_PvpBattleLog, { battleLog });
    this.mover.socket.write(choiceItemBattlelogResponse);
  }

  async handleInput(responseCode) {
    if (responseCode < 1 || responseCode > MAX_BUTTON_COUNT) {
      invalidResponseCode(this.socket);
    }

    if (responseCode > this.mover.items.length) {
      this.changeState(PvpActionState);
    } else {
      const itemIdx = responseCode;
      this.pvpRoom.selectedItem = itemIdx;
      this.changeState(PvpUseItemState);
    }
  }
}
