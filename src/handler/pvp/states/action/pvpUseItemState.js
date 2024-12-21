// src/handler/pvp/states/action/pvpUseItemState.js

import PvpState from '../base/pvpState.js';
import PvpTurnChangeState from '../turn/pvpTurnChangeState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../../constants/battle.js';
import { updateItemCountInRedis } from '../../../../db/redis/itemService.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { ITEM_TYPES } from '../../../../constants/items.js';
import logger from '../../../../utils/log/logger.js';
import { BASE_ITEM_CODE_OFFSET } from '../../../../constants/pvp.js';

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class PvpUseItemState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.USE_ITEM;

    const selectedItemId = this.pvpRoom.selectedItem + BASE_ITEM_CODE_OFFSET;
    const itemEffect = ITEM_TYPES[selectedItemId];

    if (!itemEffect) {
      logger.error(`PvpUseItemState: 존재하지 않는 아이템 ID ${selectedItemId}`);
      invalidResponseCode(this.mover.socket);
      return;
    }

    try {
      await this.mover.inventory.useItem(selectedItemId, this.mover);
      await this.sendPlayerHpMp();

      const msg = await this.mover.inventory.returnMessage();
      await this.makeBattleLog(msg);

      await updateItemCountInRedis(this.mover.nickname, selectedItemId, -1);
      await this.mover.inventory.reduceItemCount(selectedItemId);
    } catch (error) {
      logger.error('PvpUseItemState: 아이템 사용 중 오류 발생:', error);
      invalidResponseCode(this.mover.socket);
    }
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      this.changeState(PvpTurnChangeState);
    } else {
      invalidResponseCode(this.mover.socket);
    }
  }

  async sendPlayerHpMp() {
    this.mover.socket.write(createResponse(PacketType.S_SetPvpPlayerHp, { hp: this.mover.stat.hp }));
    this.mover.socket.write(createResponse(PacketType.S_SetPvpPlayerMp, { mp: this.mover.stat.mp }));
    this.stopper.socket.write(createResponse(PacketType.S_SetPvpEnemyHp, { hp: this.mover.stat.hp }));
  }

  async makeBattleLog(msg) {
    const battleLog = { msg, typingAnimation: false, btns: BUTTON_CONFIRM };
    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));
  }
}
