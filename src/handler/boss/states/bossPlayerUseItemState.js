// src/handler/boss/states/bossPlayerUseItemState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { updateItemCountInRedis } from '../../../db/redis/itemService.js';
import { PacketType } from '../../../constants/header.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { ITEM_TYPES } from '../../../constants/items.js';
import BossTurnChangeState from './bossTurnChangeState.js';
import BossItemChoiceState from './bossItemChoiceState.js';

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];
const BASE_ITEM_CODE_OFFSET = 4000;

export default class BossPlayerUseItemState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.USE_ITEM;
    this.user.completeTurn = true;

    const selectedItemId = this.bossRoom.selectedItem + BASE_ITEM_CODE_OFFSET; // Assuming item IDs start at 4001
    const itemEffect = ITEM_TYPES[selectedItemId];

    if (!itemEffect) {
      console.error(`PvpUseItemState: 존재하지 않는 아이템 ID ${selectedItemId}`);
      invalidResponseCode(this.user.socket);
      return;
    }

    // 아이템 사용
    await this.user.inventory.useItem(selectedItemId, this.user);

    // 파티원 전체에게 Hp, Mp 상태 전송
    await this.sendStatusUpdate();

    // 배틀로그 메세지 추출
    const msg = `${this.user.nickname}님이 ` + (await this.user.inventory.returnMessage());

    await this.sendBattleLogResponse(msg);

    // 아이템 수량 업데이트
    await updateItemCountInRedis(this.user.nickname, selectedItemId, -1);
    await this.user.inventory.reduceItemCount(selectedItemId);

    this.changeState(BossTurnChangeState);
  }

  // HP, MP 패킷 전송 함수
  sendStatusUpdate() {
    const statusResponse = createResponse(PacketType.S_BossPlayerStatusNotification, {
      playerId: [this.user.id],
      hp: [this.user.stat.hp],
      mp: [this.user.stat.mp],
    });

    this.users.forEach((user) => {
      user.socket.write(statusResponse);
    });
  }

  // 배틀로그 전송 함수
  sendBattleLogResponse(msg) {
    const battleLog = {
      msg,
      typingAnimation: false,
      btns: BUTTON_OPTIONS.map((msg) => ({ msg, enable: false })),
    };

    this.users.forEach((user) => {
      user.socket.write(createResponse(PacketType.S_BossBattleLog, { battleLog }));
    });
  }
}
