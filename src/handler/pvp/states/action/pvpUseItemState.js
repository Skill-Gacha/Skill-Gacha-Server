// src/handler/pvp/states/pvpUseItemState.js

import PvpState from '../base/pvpState.js';
import PvpTurnChangeState from '../turn/pvpTurnChangeState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../../constants/battle.js';
import { updateItemCountInRedis } from '../../../../db/redis/itemService.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { ITEM_TYPES } from '../../../../constants/items.js';
import logger from '../../../../utils/log/logger.js';

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];
const BASE_ITEM_CODE_OFFSET = 4000;

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
      // 아이템 사용
      await this.mover.inventory.useItem(selectedItemId, this.mover);

      // HP, MP 업데이트
      await this.sendPlayerHpMp();

      // 배틀로그 메세지 추출
      const msg = await this.mover.inventory.returnMessage();

      // 배틀로그 패킷 전송
      await this.makeBattleLog(msg);

      // 아이템 수량 업데이트
      await updateItemCountInRedis(this.mover.nickname, selectedItemId, -1);
      await this.mover.inventory.reduceItemCount(selectedItemId);
    } catch (error) {
      logger.error('PvpUseItemState: 아이템 사용 중 오류 발생:', error);
      invalidResponseCode(this.mover.socket);
    }
  }

  // 물약을 마신 후 "확인" 누른 이후
  // "확인" 버튼은 responseCode 1번으로 옵니다.
  async handleInput(responseCode) {
    if (responseCode === 1) {
      // 유저 턴이 끝 마친 상태라 상대 공격 상태로 변경
      this.changeState(PvpTurnChangeState);
    } else {
      // 예외 처리
      invalidResponseCode(this.mover.socket);
    }
  }

  // mover의 현재 Hp, Mp를 클라이언트에 제공해주는 함수
  async sendPlayerHpMp() {
    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerHp, { hp: this.mover.stat.hp }),
    );
    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerMp, { mp: this.mover.stat.mp }),
    );
    this.stopper.socket.write(
      createResponse(PacketType.S_SetPvpEnemyHp, { hp: this.mover.stat.hp }),
    );
  }

  // 배틀로그를 만들어주는 함수
  async makeBattleLog(msg) {
    const battleLog = {
      msg,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));
  }
}
