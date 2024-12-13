// src/handler/boss/states/combat/bossPlayerUseItemState.js

import { BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import { updateItemCountInRedis } from '../../../../db/redis/itemService.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { ITEM_TYPES } from '../../../../constants/items.js';
import BossTurnChangeState from '../turn/bossTurnChangeState.js';
import logger from '../../../../utils/log/logger.js';
import { sendBossBattleLog, sendBossPlayerStatusOfUsers } from '../../../../utils/battle/bossHelpers.js';

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];
const BASE_ITEM_CODE_OFFSET = 4000;

export default class BossPlayerUseItemState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.USE_ITEM;
    this.user.completeTurn = true;

    const selectedItemId = this.bossRoom.selectedItem + BASE_ITEM_CODE_OFFSET;
    const itemEffect = ITEM_TYPES[selectedItemId];

    if (!itemEffect) {
      logger.error(`bossPlayerUseItemState: 존재하지 않는 아이템 ID ${selectedItemId}`);
      invalidResponseCode(this.user.socket);
      return;
    }

    await this.user.inventory.useItem(selectedItemId, this.user);

    sendBossPlayerStatusOfUsers(this.users, [this.user]);

    const msg = `${this.user.nickname}님이 ` + (await this.user.inventory.returnMessage());
    sendBossBattleLog(this.users, msg, BUTTON_OPTIONS.map((m) => ({ msg: m, enable: false })));

    await updateItemCountInRedis(this.user.nickname, selectedItemId, -1);
    await this.user.inventory.reduceItemCount(selectedItemId);

    this.changeState(BossTurnChangeState);
  }
}
