// src/handler/boss/states/action/bossItemChoiceState.js

import { BOSS_STATUS, MAX_BUTTON_COUNT } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { getProductData } from '../../../../init/loadAssets.js';
import BossActionState from './bossActionState.js';
import BossPlayerUseItemState from '../combat/bossPlayerUseItemState.js';

const BUTTON_BACK = '뒤로 가기';
const BACK_BUTTON_POSITION = 6;
const BASE_ITEM_ID_OFFSET = 4001;
const BERSERK_POTION_ID = 4003;

export default class BossItemChoiceState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.ITEM_CHOICE;

    const itemsData = getProductData();
    const itemsName = itemsData.map((itemData) => itemData.name);

    const buttons = this.user.items.map((item) => ({
      msg: `${itemsName[item.itemId - BASE_ITEM_ID_OFFSET]}(보유 수량: ${item.count})`,
      enable: this.isItemUsable(item),
    }));

    buttons.push({
      msg: BUTTON_BACK,
      enable: true,
    });

    const battleLog = {
      msg: '사용하실 아이템을 선택해 주세요',
      typingAnimation: false,
      btns: buttons,
    };

    const choiceItemBattlelogResponse = createResponse(PacketType.S_BossBattleLog, { battleLog });
    this.user.socket.write(choiceItemBattlelogResponse);
  }

  async handleInput(responseCode) {
    if (!this.isValidResponseCode(responseCode)) {
      invalidResponseCode(this.socket);
      return;
    }

    if (responseCode === BACK_BUTTON_POSITION) {
      this.changeState(BossActionState);
      return;
    }

    const itemIdx = responseCode;
    this.bossRoom.selectedItem = itemIdx;

    this.changeState(BossPlayerUseItemState);
  }

  isItemUsable(item) {
    if (item.itemId === BERSERK_POTION_ID) {
      return !this.user.stat.berserk && item.count > 0;
    }
    return item.count > 0;
  }

  isValidResponseCode(code) {
    return code >= 1 && code <= MAX_BUTTON_COUNT;
  }
}
