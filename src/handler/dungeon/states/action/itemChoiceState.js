// src/handler/dungeon/states/action/itemChoiceState.js

import DungeonState from '../base/dungeonState.js';
import { DUNGEON_STATUS, MAX_BUTTON_COUNT } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { getProductData } from '../../../../init/loadAssets.js';
import ActionState from './actionState.js';
import PlayerUseItemState from '../combat/playerUseItemState.js';
import { sendBattleLog } from '../../../../utils/battle/dungeonHelpers.js';

const BUTTON_BACK = '뒤로 가기';
const BACK_BUTTON_POSITION = 6;
const BASE_ITEM_ID_OFFSET = 4001;

export default class ItemChoiceState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.ITEM_CHOICE;

    const itemsData = getProductData();
    const itemsName = itemsData.map((itemData) => itemData.name);
    const items = await this.user.inventory.getItemList();

    const buttons = await Promise.all(
      items.map(async (item) => ({
        msg: `${itemsName[item.itemId - BASE_ITEM_ID_OFFSET]}(보유 수량: ${item.count})`,
        enable: await this.user.inventory.isItemUsable(item, this.user),
      })),
    );

    buttons.push({ msg: BUTTON_BACK, enable: true });

    sendBattleLog(this.socket, '사용하실 아이템을 선택해 주세요', buttons);
  }

  async handleInput(responseCode) {
    if (responseCode < 1 || responseCode > MAX_BUTTON_COUNT) {
      invalidResponseCode(this.socket);
      return;
    }

    if (responseCode === BACK_BUTTON_POSITION) {
      this.changeState(ActionState);
      return;
    }

    this.dungeon.selectedItem = responseCode;
    this.changeState(PlayerUseItemState);
  }
}
