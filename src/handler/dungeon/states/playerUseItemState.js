// src/handler/dungeon/states/playerUseItemState.js

import DungeonState from './dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import ItemChoiceState from './ItemChoiceState.js';
import { updateItemCountInRedis } from '../../../db/redis/itemService.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { ITEM_TYPES } from '../../../constants/items.js';

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];
const BASE_ITEM_CODE_OFFSET = 4000;

export default class PlayerUseItemState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.USE_ITEM;

    const selectedItemId = this.dungeon.selectedItem + BASE_ITEM_CODE_OFFSET;
    const itemEffect = ITEM_TYPES[selectedItemId];

    if (!itemEffect) {
      console.error(`PlayerUseItemState: 존재하지 않는 아이템 ID ${selectedItemId}`);
      invalidResponseCode(this.socket);
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
        console.error(`PlayerUseItemState: 처리되지 않은 아이템 효과 ${itemEffect}`);
        invalidResponseCode(this.socket);
        return;
    }

    // 아이템 수량 업데이트
    try {
      await updateItemCountInRedis(this.user.nickname, selectedItemId, -1);
      await this.user.updateItem(this.user.nickname);
    } catch (error) {
      console.error('PlayerUseItemState: 아이템 수량 업데이트 중 오류 발생:', error);
      invalidResponseCode(this.socket);
    }
  }

  async useHpPotion() {
    const existingHp = this.user.stat.hp;
    this.user.increaseHpMp(100, 0);

    this.socket.write(
      createResponse(PacketType.S_SetPlayerHp, {
        hp: this.user.stat.hp,
      }),
    );

    const battleLog = {
      msg: `HP 회복 포션을 사용하여 HP를 ${this.user.stat.hp - existingHp} 회복했습니다.`,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.socket.write(createResponse(PacketType.S_BattleLog, { battleLog }));
  }

  async useMpPotion() {
    const existingMp = this.user.stat.mp;
    this.user.increaseHpMp(0, 60);

    this.socket.write(
      createResponse(PacketType.S_SetPlayerMp, {
        mp: this.user.stat.mp,
      }),
    );

    const battleLog = {
      msg: `MP 회복 포션을 사용하여 MP를 ${this.user.stat.mp - existingMp} 회복했습니다.`,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.socket.write(createResponse(PacketType.S_BattleLog, { battleLog }));
  }

  async useBerserkPotion() {
    if (this.user.stat.hp <= 20 || this.user.stat.berserk) {
      // 아이템 선택 상태로 돌아가기
      this.changeState(ItemChoiceState);
      return; // 함수 종료
    }

    this.user.reduceHp(50);
    this.user.stat.berserk = true;

    this.socket.write(
      createResponse(PacketType.S_SetPlayerHp, {
        hp: this.user.stat.hp,
      }),
    );

    const battleLog = {
      msg: `광포화 포션을 사용하여 HP가 50 감소하고, 일시적으로 공격력이 2.5배 증가했습니다.`,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.socket.write(createResponse(PacketType.S_BattleLog, { battleLog }));
  }

  async useDangerPotion() {
    const dangerRandomNum = Math.floor(Math.random() * 100);
    let battleLogMsg = '';

    if (dangerRandomNum < 25) {
      this.user.reduceHp(this.user.stat.hp - 1);
      battleLogMsg = `위험한 포션의 부작용으로 HP가 1만 남게 되었습니다.`;
    } else if (dangerRandomNum < 50) {
      this.user.increaseHpMp(this.user.stat.maxHp - this.user.stat.hp, this.user.stat.maxMp - this.user.stat.mp);
      battleLogMsg = `위험한 포션을 사용하여 HP와 MP가 최대치로 회복되었습니다.`;
    } else if (dangerRandomNum < 75) {
      this.user.stat.dangerPotion = true;
      battleLogMsg = `위험한 포션을 사용하여 일시적으로 공격력이 5배 증가했습니다.`;
    } else {
      this.user.stat.protect = true;
      battleLogMsg = `위험한 포션을 사용하여 일시적으로 무적 상태가 되었습니다.`;
    }

    // HP, MP 업데이트
    this.socket.write(
      createResponse(PacketType.S_SetPlayerHp, { hp: this.user.stat.hp }),
    );
    this.socket.write(
      createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }),
    );

    const battleLog = {
      msg: battleLogMsg,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.socket.write(createResponse(PacketType.S_BattleLog, { battleLog }));
  }

  async usePanacea() {
    // 상태 이상 해제 로직 추가
    this.user.stat.berserk = false;
    this.user.stat.protect = false;
    this.user.stat.dangerPotion = false;

    const battleLog = {
      msg: `만병통치약을 사용하여 모든 상태 이상을 해제했습니다.`,
      typingAnimation: false,
      btns: BUTTON_CONFIRM,
    };

    this.socket.write(createResponse(PacketType.S_BattleLog, { battleLog }));
    this.socket.write(
      createResponse(PacketType.S_SetPlayerHp, { hp: this.user.stat.hp }),
    );
    this.socket.write(
      createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      this.changeState(EnemyAttackState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
