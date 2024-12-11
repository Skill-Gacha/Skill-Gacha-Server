import { ITEM_TYPES } from '../../constants/items.js';

const BASE_ITEM_ID_OFFSET = 4001;
const STIMPACK_POTION_ID = 4003;

// CRUD
class Item {
  // itemId에 따른 효과와 개수를 컨트롤 하기 위해 만든 클래스
  constructor(items) {
    this.items = items;
    // [{itemId, count},{itemId, count},{itemId, count},{itemId, count},{itemId, count}];
    //index:   0               1               2               3               4
    this.msg;
  }

  async findByItemId(itemId) {
    return this.items.find((item) => item.itemId === itemId);
  }

  async getItemList() {
    return this.items;
  }

  // 아이템 개수 갱신해주는 함수
  async updateItemCount(item) {
    this.items[item.itemId - BASE_ITEM_ID_OFFSET].count = item.count;
  }

  // 아이템 사용 가능 여부 확인 함수
  async isItemUsable(item, user) {
    // 스팀팩 사용 가능 여부 확인 해주는 조건문
    if (this.items[item.itemId - BASE_ITEM_ID_OFFSET].itemId === STIMPACK_POTION_ID) {
      // 스팀팩(광포화 포션)
      return (
        !user.stat.stimPack &&
        this.items[item.itemId - BASE_ITEM_ID_OFFSET].count > 0 &&
        user.stat.hp > 50
      );
    }
    // 다른 아이템들은 개수가 0 이상이면, 사용 가능
    return item.count > 0;
  }

  // 사용할 아이템
  async useItem(itemId, user) {
    const itemEffect = ITEM_TYPES[itemId];
    //아이템 사용 로직 분기
    switch (itemEffect) {
      //  HP 회복 포션
      case 'HP_POTION':
        await this.useHpPotion(user);
        break;
      // MP 회복 포션
      case 'MP_POTION':
        await this.useMpPotion(user);
        break;
      // 스팀팩 포션
      case 'STIMPACK_POTION':
        await this.useStimPackPotion(user);
        break;
      // 위험한 포션
      case 'DANGER_POTION':
        await this.useDangerPotion(user);
        break;
      // 만병통치약(저항력 감소 디버프 해제 포션)
      case 'PANACEA':
        await this.usePanacea(user);
        break;
      default:
        //logger.error(`PlayerUseItemState: 처리되지 않은 아이템 효과 ${itemEffect}`);
        //invalidResponseCode(this.socket);
        return;
    }
  }

  // 아이템 갯수 차감
  async reduceItemCount(itemId) {
    this.items[itemId - BASE_ITEM_ID_OFFSET].count--;
  }

  // Hp 포션 사용 함수
  async useHpPotion(user) {
    const existingHp = user.stat.hp;
    user.increaseHpMp(100, 0);
    this.msg = `HP 회복 포션을 사용하여 HP를 ${user.stat.hp - existingHp} 회복했습니다.`;
  }

  // Mp 포션 사용 함수
  async useMpPotion(user) {
    const existingMp = user.stat.mp;
    user.increaseHpMp(0, 60);
    this.msg = `MP 회복 포션을 사용하여 MP를 ${user.stat.mp - existingMp} 회복했습니다.`;
  }

  // 스팀팩 사용 함수
  async useStimPackPotion(user) {
    user.reduceHp(50);
    user.stat.stimPack = true;
    this.msg = `스팀팩을 사용하여 HP가 50 감소하고, 일시적으로 공격력이 2.5배 증가했습니다.`;
  }

  // 위험한 포션 사용 함수
  async useDangerPotion(user) {
    let random = Math.floor(Math.random() * 100);
    if (random < 25) {
      user.reduceHp(user.stat.hp - 1);
      this.msg = `위험한 포션의 부작용으로 HP가 1만 남게 되었습니다.`;
    } else if (random < 50) {
      user.increaseHpMp(user.stat.maxHp - user.stat.hp, user.stat.maxMp - user.stat.mp);
      this.msg = `위험한 포션을 사용하여 HP와 MP가 최대치로 회복되었습니다.`;
    } else if (random < 75) {
      user.stat.dangerPotion = true;
      this.msg = `위험한 포션을 사용하여 일시적으로 공격력이 5배 증가했습니다.`;
    } else {
      user.stat.protect = true;
      this.msg = `위험한 포션을 사용하여 일시적으로 무적 상태가 되었습니다.`;
    }
  }

  // 만병통치약 사용 함수
  async usePanacea(user) {
    user.stat.downResist = false;
    this.msg = `만병통치약을 사용하여 모든 상태 이상을 해제했습니다.`;
  }

  // async getEnableButton(itemsName, user) {
  //   const buttons = await Promise.all(
  //     this.items.map(async (item) => ({
  //       msg: `${itemsName[item.itemId - BASE_ITEM_ID_OFFSET]}(보유 수량: ${item.count})`,
  //       enable: await this.isItemUsable(item, user),
  //     })),
  //   );
  //   return buttons;
  // }

  // 배틀로그 메세지 추출 함수
  async returnMessage() {
    return this.msg;
  }
}

export default Item;
