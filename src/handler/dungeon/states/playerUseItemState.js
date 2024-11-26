// src/handler/dungeon/states/playerUseItemState.js
import DungeonState from './dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import ItemChoiceState from './ItemChoiceState.js';
import { updateItemCountInRedis } from '../../../db/redis/itemService.js';

// 플레이어가 아이템을 사용하는 상태
export default class PlayerUseItemState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.USE_ITEM;

    const selectedItem = this.dungeon.selectedItem;
    const btns = [{ msg: '확인', enable: true }];
    const existingHp = this.user.stat.hp;
    const existingMp = this.user.stat.mp;

    switch (selectedItem) {
      //**HP 회복 포션**//==============================================================================================
      case 1:
        this.user.increaseHpMp(100, 0);

        // 유저 HP 업데이트
        const setPlayerHpResponse = createResponse(PacketType.S_SetPlayerHp, {
          hp: this.user.stat.hp,
        });
        this.socket.write(setPlayerHpResponse);

        // 회복 로그
        const hpIncreaseLogResponse = createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: `HP 회복 포션을 사용하여 HP를 ${this.user.stat.hp - existingHp} 회복했다.`,
            typingAnimation: false,
            btns,
          },
        });
        this.socket.write(hpIncreaseLogResponse);
        break;

      //**MP 회복 포션**//===================================================================================================
      case 2:
        this.user.increaseHpMp(0, 60);

        // 유저 MP 업데이트
        const setPlayerMpResponse = createResponse(PacketType.S_SetPlayerMp, {
          mp: this.user.stat.mp,
        });
        this.socket.write(setPlayerMpResponse);

        // 회복 로그
        const mpIncreaseLogResponse = createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: `MP 회복 포션을 사용하여 MP를 ${this.user.stat.mp - existingMp} 회복했다.`,
            typingAnimation: false,
            btns,
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

        this.user.reduceHp(50);
        this.user.stat.berserk = true;

        // 유저 HP 업데이트
        const sideEffectResponse = createResponse(PacketType.S_SetPlayerHp, {
          hp: this.user.stat.hp,
        });
        this.socket.write(sideEffectResponse);

        const berserkLogResponse = createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: `광포화 포션을 사용하여 HP가 50 감소하고, 일시적으로 공격력이 2.5배 증가했다.`,
            typingAnimation: false,
            btns,
          },
        });
        this.socket.write(berserkLogResponse);
        break;

      //**위험한 포션**// ========================================================================================================
      case 4:
        const dangerRandomNum = Math.floor(Math.random() * 100);

        if (dangerRandomNum < 25) {
          // 1만 남기고, HP 감소
          this.user.reduceHp(this.user.stat.hp - 1);

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
              btns,
            },
          });
          this.socket.write(randomLogResponse);
        }
        if (dangerRandomNum >= 25 && dangerRandomNum < 50) {
          // 최대 체력 - 현재 체력만큼 회복
          this.user.increaseHpMp(
            this.user.stat.maxHp - this.user.stat.hp,
            this.user.stat.maxMp - this.user.stat.mp,
          );

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
              btns,
            },
          });
          this.socket.write(randomLogResponse);
        }
        if (dangerRandomNum >= 50 && dangerRandomNum < 75) {
          this.user.stat.dangerPotion = true;

          const randomLogResponse = createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: `위험한 포션을 사용하여 일시적으로 공격력이 5배 증가했다.`,
              typingAnimation: false,
              btns,
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
              btns,
            },
          });
          this.socket.write(randomLogResponse);
        }
        break;

      //**만병통치약**// ===================================================================================================================
      case 5:
        // 상태이상 풀어주는 로직 추가해야 됨(아직 디버프가 없음) => 상태이상을 true에서 false로 바꿔주면 됨

        break;
    }
    await updateItemCountInRedis(this.user.nickname, this.dungeon.selectedItem + 4000, -1);
    await this.user.updateItem(this.user.nickname);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
    if (responseCode === 1) {
      this.changeState(EnemyAttackState); // 플레이어 확인 후 다음 상태로 전환
    } else {
      // 유효하지 않은 응답 처리
      invalidResponseCode(this.socket);
    }
  }
}
