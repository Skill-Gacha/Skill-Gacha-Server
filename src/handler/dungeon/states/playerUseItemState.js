// src/handler/dungeon/states/playerUseItemState.js
import DungeonState from './dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import { getProductData } from '../../../init/loadAssets.js';
import { applyPotionEffect } from '../../../utils/battle/calculate.js';
import ItemChoiceState from './ItemChoiceState.js';
import { updateItemCountInRedis } from '../../../db/redis/itemService.js';

// 플레이어가 아이템을 사용하는 상태
export default class PlayerUseItemState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.USE_ITEM;

    const selectedItem = this.dungeon.selectedItem;

    const itemsData = getProductData(); //이부분 수정 할수있으면 하기 두번불러짐
    const itemsName = itemsData.map((itemData) => itemData.name);

    // 아이템 사용 시 의도되지 않은 조작 방지 위한 버튼 비활성화
    const disableButtons = this.user.items.map((item) => ({
      msg: `${itemsName[item.itemId - 4001]}(보유 수량: ${item.count})`,
      enable: false,
    }));

    switch (selectedItem) {
      //**HP 회복 포션**//==============================================================================================
      case 1:
        this.user.increaseHpMp(30, 0);

        // 유저 HP 업데이트
        const setPlayerHpResponse = createResponse(PacketType.S_SetPlayerHp, {
          hp: this.user.stat.hp,
        });
        this.socket.write(setPlayerHpResponse);

        // 회복 로그
        const hpIncreaseLogResponse = createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: `HP 회복 포션을 사용하여 HP를 30 회복했다.`,
            typingAnimation: false,
            btns: disableButtons,
          },
        });
        this.socket.write(hpIncreaseLogResponse);
        break;

      //**MP 회복 포션**//===================================================================================================
      case 2:
        this.user.increaseHpMp(0, 30);

        // 유저 MP 업데이트
        const setPlayerMpResponse = createResponse(PacketType.S_SetPlayerMp, {
          mp: this.user.stat.mp,
        });
        this.socket.write(setPlayerMpResponse);

        // 회복 로그
        const mpIncreaseLogResponse = createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: `MP 회복 포션을 사용하여 MP를 30 회복했다.`,
            typingAnimation: false,
            btns: disableButtons,
          },
        });
        this.socket.write(mpIncreaseLogResponse);
        break;

      //20이하 버튼 비활성화, 같은 아이템 중첩불가능하게 true 이면 버튼 비활성화
      //**스팀팩(광포화 포션)**//==============================================================================================
      case 3:
        if (this.user.stat.hp <= 20 || this.user.stat.berserk) {
          // 아이템 선택 상태로 돌아가기
          this.changeState(ItemChoiceState);
          return; // 함수 종료
        }

        this.user.reduceHp(20);
        this.user.stat.berserk = true;

        // 유저 HP 업데이트
        const sideEffectResponse = createResponse(PacketType.S_SetPlayerHp, {
          hp: this.user.stat.hp,
        });
        this.socket.write(sideEffectResponse);

        const berserkLogResponse = createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: `광포화 포션을 사용하여 HP가 20 감소하고, 일시적으로 공격력이 200% 증가했다.`,
            typingAnimation: false,
            btns: disableButtons,
          },
        });
        this.socket.write(berserkLogResponse);
        break;

      //**위험한 포션**// ========================================================================================================
      case 4:
        const dangerRandomNum = Math.floor(Math.random() * 100);

        if (dangerRandomNum < 25) {
          // 1만 남기고, HP 감소
          const userHp = this.user.stat.hp;
          this.user.reduceHp(userHp - 1);

          // 유저 HP 업데이트
          const setPlayerHpResponse = createResponse(PacketType.S_SetPlayerHp, {
            hp: this.user.stat.hp,
          });
          this.socket.write(setPlayerHpResponse);

          // 최대 회복 로그
          const randomLogResponse = createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: `위험한 포션의 부작용으로 HP가 1만 남게 되었다.`,
              typingAnimation: false,
              btns: disableButtons,
            },
          });
          this.socket.write(randomLogResponse);
        }
        if (dangerRandomNum >= 25 && dangerRandomNum < 50) {
          const userHp = this.user.stat.hp;
          const userMp = this.user.stat.mp;
          this.user.increaseHpMp(100 - userHp, 100 - userMp);

          // 유저 HP 업데이트
          const setPlayerHpResponse = createResponse(PacketType.S_SetPlayerHp, {
            hp: this.user.stat.hp,
          });
          this.socket.write(setPlayerHpResponse);
          // 유저 MP 업데이트
          const setPlayerMpResponse = createResponse(PacketType.S_SetPlayerMp, {
            mp: this.user.stat.mp,
          });
          this.socket.write(setPlayerMpResponse);
          // 최대 회복 로그
          const randomLogResponse = createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: `위험한 포션을 사용하여 HP와 MP가 최대치로 회복되었다.`,
              typingAnimation: false,
              btns: disableButtons,
            },
          });
          this.socket.write(randomLogResponse);
        }
        if (dangerRandomNum >= 50 && dangerRandomNum < 75) {
          this.user.stat.dangerPotion = true;

          const randomLogResponse = createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: `위험한 포션을 사용하여 일시적으로 공격력이 500% 증가했다.`,
              typingAnimation: false,
              btns: disableButtons,
            },
          });
          this.socket.write(randomLogResponse);
        }
        if (dangerRandomNum >= 75 && dangerRandomNum < 100) {
          this.user.stat.protect = true;

          const randomLogResponse = createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: `위험한 포션을 사용하여 일시적으로 무적 상태가 되었다.`,
              typingAnimation: false,
              btns: disableButtons,
            },
          });
          this.socket.write(randomLogResponse);
        }
        break;

      //**저항 포션**// ===================================================================================================================
      case 5:
        const resistRandomNum = Math.floor(Math.random() * 100);
        // 확률에 따라 효과 적용 및 로그 출력
        if (resistRandomNum < 90) {
          this.user.stat.resistbuff = true;

          applyPotionEffect(this.user.stat.resistances); // 저항력을 100으로 채우는 함수 호출

          const resistRandomLogResponse = createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: `속성 저항 포션을 사용하여 일시적으로 무적 상태가 되었다.`,
              typingAnimation: false,
              btns: disableButtons,
            },
          });
          this.socket.write(resistRandomLogResponse);
        } else {
          const resistRandomLogResponse = createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: `속성 저항 포션이 상한 것 같다. 별다른 효과를 얻지 못했다.`,
              typingAnimation: false,
              btns: disableButtons,
            },
          });
          this.socket.write(resistRandomLogResponse);
        }
        break;
    }
    await updateItemCountInRedis(this.user.nickname, this.dungeon.selectedItem + 4000, -1);
    await this.user.updateItem(this.user.nickname);
    await delay(1000);

    this.changeState(EnemyAttackState);
  }
}
