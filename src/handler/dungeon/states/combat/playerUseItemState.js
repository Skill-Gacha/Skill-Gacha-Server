// src/handler/dungeon/states/combat/playerUseItemState.js

import DungeonState from '../base/dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import { updateItemCountInRedis } from '../../../../db/redis/itemService.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import logger from '../../../../utils/log/logger.js';
import { sendBattleLog, sendPlayerHpMp } from '../../../../utils/battle/dungeonHelpers.js';

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];
const BASE_ITEM_CODE_OFFSET = 4000;

export default class PlayerUseItemState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.USE_ITEM;

    const selectedItemId = this.dungeon.selectedItem + BASE_ITEM_CODE_OFFSET;
    if (!selectedItemId) {
      logger.error(`PlayerUseItemState: 존재하지 않는 아이템 ID ${selectedItemId}`);
      invalidResponseCode(this.socket);
      return;
    }

    await this.user.inventory.useItem(selectedItemId, this.user);
    sendPlayerHpMp(this.socket, this.user);

    const msg = await this.user.inventory.returnMessage();
    sendBattleLog(this.socket, msg, BUTTON_CONFIRM);

    try {
      await updateItemCountInRedis(this.user.nickname, selectedItemId, -1);
      await this.user.inventory.reduceItemCount(selectedItemId);
    } catch (error) {
      logger.error('PlayerUseItemState: 아이템 수량 업데이트 중 오류 발생:', error);
      invalidResponseCode(this.socket);
    }
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      this.changeState(EnemyAttackState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
