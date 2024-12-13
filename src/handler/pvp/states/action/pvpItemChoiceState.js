// src/handler/pvp/states/action/pvpItemChoiceState.js

import PvpActionState from './pvpActionState.js';
import PvpState from '../base/pvpState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { MAX_BUTTON_COUNT, PVP_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { getProductData } from '../../../../init/loadAssets.js';
import PvpUseItemState from './pvpUseItemState.js';
import { BASE_ITEM_ID_OFFSET } from '../../../../constants/pvp.js';

const BUTTON_BACK = '뒤로 가기';
const BACK_BUTTON_POSITION = 6;

export default class PvpItemChoiceState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.ITEM_CHOICE;

    const itemsData = getProductData();
    const itemsName = itemsData.map((itemData) => itemData.name);
    const items = await this.mover.inventory.getItemList();

    const buttons = await Promise.all(
      items.map(async (item) => ({
        msg: `${itemsName[item.itemId - BASE_ITEM_ID_OFFSET]}(보유 수량: ${item.count})`,
        enable: await this.mover.inventory.isItemUsable(item, this.mover),
      })),
    );

    buttons.push({ msg: BUTTON_BACK, enable: true });

    const battleLog = {
      msg: '사용하실 아이템을 선택해 주세요',
      typingAnimation: false,
      btns: buttons,
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));
  }

  async handleInput(responseCode) {
    if (responseCode < 1 || responseCode > MAX_BUTTON_COUNT) {
      invalidResponseCode(this.mover.socket);
      return;
    }

    if (responseCode === BACK_BUTTON_POSITION) {
      this.changeState(PvpActionState);
      return;
    }

    const itemIdx = responseCode;
    this.pvpRoom.selectedItem = itemIdx;

    this.changeState(PvpUseItemState);
  }
}
