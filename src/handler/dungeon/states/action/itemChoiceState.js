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

export default class ItemChoiceState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.ITEM_CHOICE;

    const itemsData = getProductData();
    const itemsName = itemsData.map((itemData) => itemData.name);

    //const buttons = await this.user.inventory.getEnableButton(itemsName, this.user);

    const items = await this.user.inventory.getItemList();

    //버튼은 플레이어가 보유한 아이템들로 생성
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

    // 아이템 로그 데이터
    const battleLog = {
      msg: '사용하실 아이템을 선택해 주세요',
      typingAnimation: false,
      btns: buttons,
    };

    const response = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(response);
  }

  async handleInput(responseCode) {
    // responseCode 유효성 검사)
    if (responseCode < 1 || responseCode > MAX_BUTTON_COUNT) {
      invalidResponseCode(this.socket);
    }

    if (responseCode === BACK_BUTTON_POSITION) {
      // 뒤로 가기 버튼
      this.changeState(ActionState);
      return;
    }
    // 선택한 아이템 인덱스 계산
    const itemIdx = responseCode;
    this.dungeon.selectedItem = itemIdx;

    // 아이템 선택 후 아이템 사용 상태로 전환
    this.changeState(PlayerUseItemState);
  }
}
