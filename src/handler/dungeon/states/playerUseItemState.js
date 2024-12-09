// src/handler/dungeon/states/playerUseItemState.js

import DungeonState from './dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import ItemChoiceState from './itemChoiceState.js';
import { updateItemCountInRedis } from '../../../db/redis/itemService.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { ITEM_TYPES } from '../../../constants/items.js';
import logger from '../../../utils/log/logger.js';

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];
const BASE_ITEM_CODE_OFFSET = 4000;

// 유저가 아이템 사용에 따른 효과 적용해주는 함수
export default class PlayerUseItemState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.USE_ITEM;

    // 선택된 responseCode + ITEM_CODE => ITEM_ID
    const selectedItemId = this.dungeon.selectedItem + BASE_ITEM_CODE_OFFSET;

    if (!selectedItemId) {
      logger.error(`PlayerUseItemState: 존재하지 않는 아이템 ID ${selectedItemId}`);
      invalidResponseCode(this.socket);
      return;
    }

    // 아이템 사용
    await this.user.inventory.useItem(selectedItemId, this.user);

    // HP, MP 업데이트
    await this.sendPlayerHpMp();

    // 배틀로그 메세지 추출
    const msg = await this.user.inventory.returnMessage();

    // 배틀로그 패킷 전송
    await this.makeBattleLog(msg);

    // 아이템 수량 업데이트
    try {
      await updateItemCountInRedis(this.user.nickname, selectedItemId, -1);
      await this.user.inventory.reduceItemCount(selectedItemId);
    } catch (error) {
      logger.error('PlayerUseItemState: 아이템 수량 업데이트 중 오류 발생:', error);
      invalidResponseCode(this.socket);
    }
  }

  // 물약을 마신 후 "확인" 누른 이후
  // "확인" 버튼은 responseCode 1번으로 옵니다.
  async handleInput(responseCode) {
    if (responseCode === 1) {
      // 유저 턴이 끝 마친 상태라 몬스터 공격 상태로 변경
      this.changeState(EnemyAttackState);
    } else {
      // 예외 처리
      invalidResponseCode(this.socket);
    }
  }

  // player의 현재 Hp, Mp를 클라이언트에 제공해주는 함수
  async sendPlayerHpMp() {
    this.socket.write(createResponse(PacketType.S_SetPlayerHp, { hp: this.user.stat.hp }));
    this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));
  }

  // 배틀로그를 만들어주는 함수
  async makeBattleLog(msg) {
    const battleLog = {
      msg,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.socket.write(createResponse(PacketType.S_BattleLog, { battleLog }));
  }
}
