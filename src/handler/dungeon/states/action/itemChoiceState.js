// src/handler/dungeon/states/itemChoiceState.js

import DungeonState from '../base/dungeonState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { DUNGEON_STATUS, MAX_BUTTON_COUNT } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import ActionState from './actionState.js';
import { getProductData } from '../../../../init/loadAssets.js';
import PlayerUseItemState from '../combat/playerUseItemState.js';

const BUTTON_BACK = '뒤로 가기';
const BACK_BUTTON_POSITION = 6;
const BASE_ITEM_ID_OFFSET = 4001;
const STIMPACK_POTION_ID = 4003;

export default class ItemChoiceState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.ITEM_CHOICE;

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

    const response = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(response);
  }

  async handleInput(responseCode) {
    if (!this.isValidResponseCode(responseCode)) {
      invalidResponseCode(this.socket);
      return;
    }

    if (responseCode === BACK_BUTTON_POSITION) {
      this.changeState(ActionState);
      return;
    }

    const itemIdx = responseCode;
    this.dungeon.selectedItem = itemIdx;

    this.changeState(PlayerUseItemState);
  }

  isItemUsable(item) {
    if (item.itemId === STIMPACK_POTION_ID) {
      return !this.user.stat.stimPack && item.count > 0;
    }
    return item.count > 0;
  }

  isValidResponseCode(code) {
    return code >= 1 && code <= MAX_BUTTON_COUNT;
  }
}
