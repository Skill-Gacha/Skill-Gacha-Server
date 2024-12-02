// src/handler/pvp/states/pvpUseItemState.js

import PvpState from './pvpState.js';
import PvpTurnChangeState from './pvpTurnChangeState.js';
import PvpItemChoiceState from './pvpItemChoiceState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import { updateItemCountInRedis } from '../../../db/redis/itemService.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { ITEM_TYPES } from '../../../constants/items.js';
import logger from '../../../utils/log/logger.js';

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
      // 아이템 사용 로직 분기
      switch (itemEffect) {
        case 'HP_POTION':
          await this.useHpPotion();
          break;
        case 'MP_POTION':
          await this.useMpPotion();
          break;
        case 'BERSERK_POTION':
          await this.useBerserkPotion();
          break;
        case 'DANGER_POTION':
          await this.useDangerPotion();
          break;
        case 'PANACEA':
          await this.usePanacea();
          break;
        default:
          logger.error(`PvpUseItemState: 처리되지 않은 아이템 효과 ${itemEffect}`);
          invalidResponseCode(this.mover.socket);
          return;
      }

      // 아이템 수량 업데이트
      await updateItemCountInRedis(this.mover.nickname, selectedItemId, -1);
      await this.mover.updateItem(this.mover.nickname);
    } catch (error) {
      logger.error('PvpUseItemState: 아이템 사용 중 오류 발생:', error);
      invalidResponseCode(this.mover.socket);
    }
  }

  async useHpPotion() {
    const existingHp = this.mover.stat.hp;
    this.mover.increaseHpMp(100, 0);

    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerHp, {
        hp: this.mover.stat.hp,
      }),
    );
    this.stopper.socket.write(
      createResponse(PacketType.S_SetPvpEnemyHp, {
        hp: this.stopper.stat.hp,
      }),
    );

    const battleLog = {
      msg: `HP 회복 포션을 사용하여 HP를 ${this.mover.stat.hp - existingHp} 회복했습니다.`,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));
  }

  async useMpPotion() {
    const existingMp = this.mover.stat.mp;
    this.mover.increaseHpMp(0, 60);

    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerMp, {
        mp: this.mover.stat.mp,
      }),
    );
    this.stopper.socket.write(
      createResponse(PacketType.S_SetPvpEnemyMp, {
        mp: this.stopper.stat.mp,
      }),
    );

    const battleLog = {
      msg: `MP 회복 포션을 사용하여 MP를 ${this.mover.stat.mp - existingMp} 회복했습니다.`,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));
  }

  async useBerserkPotion() {
    if (this.mover.stat.hp <= 20 || this.mover.stat.berserk) {
      // 아이템 선택 상태로 돌아가기
      this.changeState(PvpItemChoiceState);
      return;
    }

    this.mover.reduceHp(50);
    this.mover.stat.berserk = true;

    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerHp, {
        hp: this.mover.stat.hp,
      }),
    );
    this.stopper.socket.write(
      createResponse(PacketType.S_SetPvpEnemyHp, {
        hp: this.stopper.stat.hp,
      }),
    );

    const battleLog = {
      msg: `광포화 포션을 사용하여 HP가 50 감소하고, 일시적으로 공격력이 2.5배 증가했습니다.`,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));
  }

  async useDangerPotion() {
    const dangerRandomNum = Math.floor(Math.random() * 100);
    let battleLogMsg = '';

    if (dangerRandomNum < 25) {
      this.mover.reduceHp(this.mover.stat.hp - 1);
      battleLogMsg = `위험한 포션의 부작용으로 HP가 1만 남게 되었습니다.`;
    } else if (dangerRandomNum < 50) {
      this.mover.increaseHpMp(this.mover.stat.maxHp - this.mover.stat.hp, this.mover.stat.maxMp - this.mover.stat.mp);
      battleLogMsg = `위험한 포션을 사용하여 HP와 MP가 최대치로 회복되었습니다.`;
    } else if (dangerRandomNum < 75) {
      this.mover.stat.dangerPotion = true;
      battleLogMsg = `위험한 포션을 사용하여 일시적으로 공격력이 5배 증가했습니다.`;
    } else {
      this.mover.stat.protect = true;
      battleLogMsg = `위험한 포션을 사용하여 일시적으로 무적 상태가 되었습니다.`;
    }

    // HP, MP 업데이트
    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerHp, { hp: this.mover.stat.hp }),
    );
    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerMp, { mp: this.mover.stat.mp }),
    );
    this.stopper.socket.write(
      createResponse(PacketType.S_SetPvpEnemyHp, { hp: this.stopper.stat.hp }),
    );

    const battleLog = {
      msg: battleLogMsg,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));
  }

  async usePanacea() {
    // 모든 상태 이상 해제
    this.mover.stat.berserk = false;
    this.mover.stat.protect = false;
    this.mover.stat.dangerPotion = false;

    const battleLog = {
      msg: `만병통치약을 사용하여 모든 상태 이상을 해제했습니다.`,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog }));
    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerHp, { hp: this.mover.stat.hp }),
    );
    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerMp, { mp: this.mover.stat.mp }),
    );
    this.stopper.socket.write(
      createResponse(PacketType.S_SetPvpEnemyHp, { hp: this.stopper.stat.hp }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      this.changeState(PvpTurnChangeState);
    } else {
      // 유효하지 않은 응답 처리
      invalidResponseCode(this.mover.socket);
    }
  }
}
