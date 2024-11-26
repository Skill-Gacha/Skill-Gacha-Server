// src/handler/dungeon/states/itemChoiceState.js

import DungeonState from './dungeonState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS, MAX_BUTTON_COUNT } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import ActionState from './actionState.js';
import { getProductData } from '../../../init/loadAssets.js';
import PlayerUseItemState from './PlayerUseItemState.js';

// 아이템 선택 상태
// 스킬과 달리, id 값 기반으로 이름 불러와야 함
export default class ItemChoiceState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.SKILL_CHOICE;

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

    const choiceItemBattlelogResponse = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(choiceItemBattlelogResponse);
  }

  async handleInput(responseCode) {
    // responseCode 유효성 검사)
    if (responseCode < 1 || responseCode > MAX_BUTTON_COUNT) {
      invalidResponseCode(this.socket);
    }

    if (responseCode > this.user.items.length) {
      this.changeState(ActionState);
    } else {
      // 선택한 아이템 인덱스 계산
      const itemIdx = responseCode;
      this.dungeon.selectedItem = itemIdx;

      // 스킬 선택 후 플레이어 어택 상태로 전환
      this.changeState(PlayerUseItemState);
    }
  }
}
