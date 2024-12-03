// src/handler/boss/states/bossItemChoiceState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { MAX_BUTTON_COUNT } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { getProductData } from '../../../init/loadAssets.js';
import BossActionState from './bossActionState.js';
import BossPlayerUseItemState from './bossPlayerUseItemState.js';

export default class BossItemChoiceState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.ITEM_CHOICE;

    const itemsData = getProductData();
    const itemsName = itemsData.map((itemData) => itemData.name);

    // 버튼은 플레이어가 보유한 아이템들로 생성
    const buttons = this.user.items.map((item) => ({
      msg: `${itemsName[item.itemId - 4001]}(보유 수량: ${item.count})`,
      enable: item.itemId === 4003 ? !this.user.stat.berserk && item.count !== 0 : item.count !== 0,
    }));

    buttons.push({
      msg: '뒤로 가기',
      enable: true,
    });

    // 아이템 로그 데이터
    const battleLog = {
      msg: '사용하실 아이템을 선택해 주세요',
      typingAnimation: false,
      btns: buttons,
    };

    const choiceItemBattlelogResponse = createResponse(PacketType.S_PvpBattleLog, { battleLog });
    this.user.socket.write(choiceItemBattlelogResponse);
  }

  async handleInput(responseCode) {
    // responseCode 유효성 검사)
    if (responseCode < 1 || responseCode > MAX_BUTTON_COUNT) {
      invalidResponseCode(this.user.socket);
    }

    if (responseCode > this.user.items.length) {
      this.changeState(BossActionState);
    } else {
      // 선택한 아이템 인덱스 계산
      const itemIdx = responseCode;
      this.bossRoom.selectedItem = itemIdx;

      // 스킬 선택 후 플레이어 어택 상태로 전환
      this.changeState(BossPlayerUseItemState);
    }
  }
}
