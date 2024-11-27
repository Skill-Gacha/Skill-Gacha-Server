// src/handler/pvp/states/pvpUseItemState.js;
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import { updateItemCountInRedis } from '../../../db/redis/itemService.js';
import PvpState from './pvpState.js';
import PvpTurnChangeState from './pvpTurnChangeState.js';
import { PacketType } from '../../../constants/header.js';
import PvpItemChoiceState from './pvpItemChoiceState.js';

// 플레이어가 아이템을 사용하는 상태
export default class PvpUseItemState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.USE_ITEM;

    const selectedItem = this.pvpRoom.selectedItem;
    const btns = [{ msg: '확인', enable: true }];
    const existingHp = this.mover.stat.hp;
    const existingMp = this.mover.stat.mp;

    switch (selectedItem) {
      //**HP 회복 포션**//==============================================================================================
      case 1:
        this.mover.increaseHpMp(100, 0);

        // 유저 HP 업데이트
        const setPlayerHpResponse = createResponse(PacketType.S_SetPvpPlayerHp, {
          hp: this.mover.stat.hp,
        });
        const setEnemyHpResponse = createResponse(PacketType.S_SetPvpEnemyHp, {
          hp: this.mover.stat.hp,
        });
        this.mover.socket.write(setPlayerHpResponse);
        this.stopper.socket.write(setEnemyHpResponse);

        // 회복 로그
        const hpIncreaseLogResponse = createResponse(PacketType.S_PvpBattleLog, {
          battleLog: {
            msg: `HP 회복 포션을 사용하여 HP를 ${this.mover.stat.hp - existingHp} 회복했다.`,
            typingAnimation: false,
            btns,
          },
        });
        this.mover.socket.write(hpIncreaseLogResponse);
        break;

      //**MP 회복 포션**//===================================================================================================
      case 2:
        this.mover.increaseHpMp(0, 60);

        // 유저 MP 업데이트
        const setPlayerMpResponse = createResponse(PacketType.S_SetPvpPlayerMp, {
          mp: this.mover.stat.mp,
        });
        this.mover.socket.write(setPlayerMpResponse);

        // 회복 로그
        const mpIncreaseLogResponse = createResponse(PacketType.S_PvpBattleLog, {
          battleLog: {
            msg: `MP 회복 포션을 사용하여 MP를 ${this.mover.stat.mp - existingMp} 회복했다.`,
            typingAnimation: false,
            btns,
          },
        });
        this.mover.socket.write(mpIncreaseLogResponse);
        break;

      //20이하 버튼 비활성화, 같은 아이템 중첩불가능하게 true 이면 버튼 비활성화
      //**스팀팩(광포화 포션)**//==============================================================================================
      case 3:
        if (this.mover.stat.hp <= 20 || this.mover.stat.berserk) {
          // 아이템 선택 상태로 돌아가기
          this.changeState(PvpItemChoiceState);
          return; // 함수 종료
        }

        this.mover.reduceHp(50);
        this.mover.stat.berserk = true;

        // 유저 HP 업데이트
        this.mover.socket.write(
          createResponse(PacketType.S_SetPvpPlayerHp, {
            hp: this.mover.stat.hp,
          }),
        );

        this.stopper.socket.write(
          createResponse(PacketType.S_SetPvpEnemyHp, {
            hp: this.mover.stat.hp,
          }),
        );

        const berserkLogResponse = createResponse(PacketType.S_PvpBattleLog, {
          battleLog: {
            msg: `광포화 포션을 사용하여 HP가 50 감소하고, 일시적으로 공격력이 2.5배 증가했다.`,
            typingAnimation: false,
            btns,
          },
        });
        this.mover.socket.write(berserkLogResponse);
        break;

      //**위험한 포션**// ========================================================================================================
      case 4:
        const dangerRandomNum = Math.floor(Math.random() * 100);

        if (dangerRandomNum < 25) {
          // 1만 남기고, HP 감소
          this.mover.reduceHp(this.mover.stat.hp - 1);

          // 유저 HP 업데이트
          const setPlayerHpResponse = createResponse(PacketType.S_SetPvpPlayerHp, {
            hp: this.mover.stat.hp,
          });
          this.mover.socket.write(setPlayerHpResponse);

          // 최대 회복 로그
          const randomLogResponse = createResponse(PacketType.S_PvpBattleLog, {
            battleLog: {
              msg: `위험한 포션의 부작용으로 HP가 1만 남게 되었다.`,
              typingAnimation: false,
              btns,
            },
          });
          this.mover.socket.write(randomLogResponse);
        }
        if (dangerRandomNum >= 25 && dangerRandomNum < 50) {
          // 최대 체력 - 현재 체력만큼 회복
          this.mover.increaseHpMp(
            this.mover.stat.maxHp - this.mover.stat.hp,
            this.mover.stat.maxMp - this.mover.stat.mp,
          );

          // 유저 HP 업데이트
          this.mover.socket.write(
            createResponse(PacketType.S_SetPvpPlayerHp, {
              hp: this.mover.stat.hp,
            }),
          );
          // 유저 MP 업데이트
          this.mover.socket.write(
            createResponse(PacketType.S_SetPvpPlayerMp, {
              mp: this.mover.stat.mp,
            }),
          );

          // 상대 HP 업데이트
          this.stopper.socket.write(
            createResponse(PacketType.S_SetPvpEnemyHp, {
              hp: this.mover.stat.hp,
            }),
          );
          // 최대 회복 로그
          const randomLogResponse = createResponse(PacketType.S_PvpBattleLog, {
            battleLog: {
              msg: `위험한 포션을 사용하여 HP와 MP가 최대치로 회복되었다.`,
              typingAnimation: false,
              btns,
            },
          });
          this.mover.socket.write(randomLogResponse);
        }
        if (dangerRandomNum >= 50 && dangerRandomNum < 75) {
          this.mover.stat.dangerPotion = true;

          const randomLogResponse = createResponse(PacketType.S_PvpBattleLog, {
            battleLog: {
              msg: `위험한 포션을 사용하여 일시적으로 공격력이 5배 증가했다.`,
              typingAnimation: false,
              btns,
            },
          });
          this.mover.socket.write(randomLogResponse);
        }
        if (dangerRandomNum >= 75 && dangerRandomNum < 100) {
          this.mover.stat.protect = true;

          const randomLogResponse = createResponse(PacketType.S_PvpBattleLog, {
            battleLog: {
              msg: `위험한 포션을 사용하여 일시적으로 무적 상태가 되었다.`,
              typingAnimation: false,
              btns,
            },
          });
          this.mover.socket.write(randomLogResponse);
        }
        break;

      //**만병통치약**// ===================================================================================================================
      case 5:
        // 상태이상 풀어주는 로직 추가해야 됨(아직 디버프가 없음) => 상태이상을 true에서 false로 바꿔주면 됨

        break;
    }
    await updateItemCountInRedis(this.mover.nickname, this.pvpRoom.selectedItem + 4000, -1);
    await this.mover.updateItem(this.mover.nickname);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
    if (responseCode === 1) {
      this.changeState(PvpTurnChangeState);
    } else {
      // 유효하지 않은 응답 처리
      invalidResponseCode(this.mover.socket);
    }
  }
}
