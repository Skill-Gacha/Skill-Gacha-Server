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

    const selectedItemId = this.bossRoom.selectedItem + BASE_ITEM_CODE_OFFSET; // Assuming item IDs start at 4001
    const itemEffect = ITEM_TYPES[selectedItemId];

    if (!itemEffect) {
      console.error(`PvpUseItemState: 존재하지 않는 아이템 ID ${selectedItemId}`);
      invalidResponseCode(this.user.socket);
      return;
    }

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
        console.error(`BossUseItemState: 처리되지 않은 아이템 효과 ${itemEffect}`);
        invalidResponseCode(this.user.socket);
        return;
    }

    // 아이템 수량 업데이트
    await updateItemCountInRedis(this.user.nickname, selectedItemId, -1);
    await this.user.updateItem(this.user.nickname);

    this.changeState(BossTurnChangeState);
  }

  async useHpPotion() {
    const existingHp = this.user.stat.hp;
    this.user.increaseHpMp(100, 0);
    const statusResponse = createResponse(PacketType.S_BossPlayerStatusNotification, {
      playerId: [this.user.id],
      hp: [this.user.stat.hp],
      mp: [this.user.stat.mp],
    });

    this.users.forEach((user) => {
      user.socket.write(statusResponse);
    });

    const battleLog = {
      msg: `HP 회복 포션을 사용하여 HP를 ${this.user.stat.hp - existingHp} 회복했습니다.`,
      typingAnimation: false,
      btns: BUTTON_OPTIONS.map((msg) => ({ msg, enable: false })),
    };

    this.user.socket.write(createResponse(PacketType.S_BossBattleLog, { battleLog }));
  }

  async useMpPotion() {
    const existingMp = this.user.stat.mp;
    this.user.increaseHpMp(0, 60);

    const statusResponse = createResponse(PacketType.S_BossPlayerStatusNotification, {
      playerId: [this.user.id],
      hp: [this.user.stat.hp],
      mp: [this.user.stat.mp],
    });

    this.users.forEach((user) => {
      user.socket.write(statusResponse);
    });

    const battleLog = {
      msg: `MP 회복 포션을 사용하여 MP를 ${this.user.stat.mp - existingMp} 회복했습니다.`,
      typingAnimation: false,
      btns: BUTTON_OPTIONS.map((msg) => ({ msg, enable: false })),
    };

    this.user.socket.write(createResponse(PacketType.S_BossBattleLog, { battleLog }));
  }

  async useBerserkPotion() {
    if (this.user.stat.hp <= 20 || this.user.stat.berserk) {
      // 아이템 선택 상태로 돌아가기
      this.changeState(BossItemChoiceState);
      return;
    }

    this.user.reduceHp(50);
    this.user.stat.berserk = true;

    const statusResponse = createResponse(PacketType.S_BossPlayerStatusNotification, {
      playerId: [this.user.id],
      hp: [this.user.stat.hp],
      mp: [this.user.stat.mp],
    });

    this.users.forEach((user) => {
      user.socket.write(statusResponse);
    });

    const battleLog = {
      msg: `광포화 포션을 사용하여 HP가 50 감소하고, 일시적으로 공격력이 2.5배 증가했습니다.`,
      typingAnimation: false,
      btns: BUTTON_OPTIONS.map((msg) => ({ msg, enable: false })),
    };

    this.user.socket.write(createResponse(PacketType.S_BossBattleLog, { battleLog }));
  }

  async useDangerPotion() {
    const dangerRandomNum = Math.floor(Math.random() * 100);
    let battleLogMsg = '';

    if (dangerRandomNum < 25) {
      this.user.reduceHp(this.user.stat.hp - 1);
      battleLogMsg = `위험한 포션의 부작용으로 HP가 1만 남게 되었습니다.`;
    } else if (dangerRandomNum < 50) {
      this.user.increaseHpMp(
        this.user.stat.maxHp - this.user.stat.hp,
        this.user.stat.maxMp - this.user.stat.mp,
      );
      battleLogMsg = `위험한 포션을 사용하여 HP와 MP가 최대치로 회복되었습니다.`;
    } else if (dangerRandomNum < 75) {
      this.user.stat.dangerPotion = true;
      battleLogMsg = `위험한 포션을 사용하여 일시적으로 공격력이 5배 증가했습니다.`;
    } else {
      this.user.stat.protect = true;
      battleLogMsg = `위험한 포션을 사용하여 일시적으로 무적 상태가 되었습니다.`;
    }

    // HP, MP 업데이트
    const statusResponse = createResponse(PacketType.S_BossPlayerStatusNotification, {
      playerId: [this.user.id],
      hp: [this.user.stat.hp],
      mp: [this.user.stat.mp],
    });

    this.users.forEach((user) => {
      user.socket.write(statusResponse);
    });

    const battleLog = {
      msg: battleLogMsg,
      typingAnimation: false,
      btns: BUTTON_OPTIONS.map((msg) => ({ msg, enable: false })),
    };

    this.user.socket.write(createResponse(PacketType.S_BossBattleLog, { battleLog }));
  }

  async usePanacea() {
    // 상태 이상 status 해제
    this.user.stat.downResist = false;

    const battleLog = {
      msg: `만병통치약을 사용하여 모든 상태 이상을 해제했습니다.`,
      typingAnimation: false,
      btns: BUTTON_OPTIONS.map((msg) => ({ msg, enable: false })),
    };

    this.user.socket.write(createResponse(PacketType.S_BossBattleLog, { battleLog }));
  }

  async handleInput(responseCode) {}
}
