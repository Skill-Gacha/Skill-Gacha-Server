// src/handler/boss/states/action/bossItemChoiceState.js

import { BOSS_STATUS, MAX_BUTTON_COUNT } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { getProductData } from '../../../../init/loadAssets.js';
import BossActionState from './bossActionState.js';
import BossPlayerUseItemState from '../combat/bossPlayerUseItemState.js';
import { sendBossBattleLog } from '../../../../utils/battle/bossHelpers.js';

const BUTTON_BACK = '뒤로 가기';
const BACK_BUTTON_POSITION = 6;
const BASE_ITEM_ID_OFFSET = 4001;

export default class BossItemChoiceState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.ITEM_CHOICE;

    const itemsData = getProductData();
    const itemsName = itemsData.map((itemData) => itemData.name);

    const items = await this.user.inventory.getItemList();
    const buttons = await Promise.all(
      items.map(async (item) => ({
        msg: `${itemsName[item.itemId - BASE_ITEM_ID_OFFSET]}(보유 수량: ${item.count})`,
        enable: await this.user.inventory.isItemUsable(item, this.user),
      })),
    );

    buttons.push({
      msg: BUTTON_BACK,
      enable: true,
    });

    sendBossBattleLog(this.user, '사용하실 아이템을 선택해 주세요', buttons);
  }

  async handleInput(responseCode) {
    if (responseCode < 1 || responseCode > MAX_BUTTON_COUNT) {
      invalidResponseCode(this.socket);
    }

    if (responseCode === BACK_BUTTON_POSITION) {
      this.changeState(BossActionState);
      return;
    }
    const itemIdx = responseCode;
    this.bossRoom.selectedItem = itemIdx;

    this.changeState(BossPlayerUseItemState);
  }
}
