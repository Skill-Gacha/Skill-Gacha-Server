// src/handler/pvp/states/pvpItemChoiceState.js

import PvpActionState from './pvpActionState.js';
import PvpState from './pvpState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { MAX_BUTTON_COUNT, PVP_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { getProductData } from '../../../init/loadAssets.js';
import PvpUseItemState from './pvpUseItemState.js';

const BUTTON_BACK = '뒤로 가기';
const BACK_BUTTON_POSITION = 6;
const BASE_ITEM_ID_OFFSET = 4001;
export default class PvpItemChoiceState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.ITEM_CHOICE;

    const itemsData = getProductData();
    const itemsName = itemsData.map((itemData) => itemData.name);

    console.log('mover : ', this.mover.inventory);
    const items = await this.mover.inventory.getItemList();

    // 버튼은 플레이어가 보유한 아이템들로 생성
    // const buttons = this.mover.items.map((item) => ({
    //   msg: `${itemsName[item.itemId - 4001]}(보유 수량: ${item.count})`,
    //   enable:
    //     item.itemId === 4003 ? !this.mover.stat.stimPack && item.count !== 0 : item.count !== 0,
    // }));

    const buttons = await Promise.all(
      items.map(async (item) => ({
        msg: `${itemsName[item.itemId - BASE_ITEM_ID_OFFSET]}(보유 수량: ${item.count})`,
        enable: await this.mover.inventory.isItemUsable(item, this.mover),
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

    const choiceItemBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, { battleLog });
    this.mover.socket.write(choiceItemBattleLogResponse);
  }

  async handleInput(responseCode) {
    // responseCode 유효성 검사
    if (responseCode < 1 || responseCode > MAX_BUTTON_COUNT) {
      invalidResponseCode(this.socket);
    }
    // 뒤로 가기 버튼
    if (responseCode === BACK_BUTTON_POSITION) {
      this.changeState(PvpActionState);
      return;
    }
    // 선택한 아이템 인덱스 계산
    const itemIdx = responseCode;
    this.pvpRoom.selectedItem = itemIdx;

    // 아이템 선택 후 아이템 사용 상태로 전환
    this.changeState(PvpUseItemState);
  }
}
