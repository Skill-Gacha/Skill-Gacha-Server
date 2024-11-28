// src/handler/dungeon/states/increaseManaState.js

import DungeonState from './dungeonState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import ActionState from './actionState.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import EnemyAttackState from './enemyAttackState.js';

export default class IncreaseManaState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.INCREASE_MANA;
    const randomHp = Math.floor(Math.random() * 6) + 5;
    const randomMp = Math.floor(Math.random() * 6) + 5;

    const existingHp = this.user.stat.hp;
    const existingMp = this.user.stat.mp;

    this.user.increaseHpMp(randomHp, randomMp);

    this.socket.write(
      createResponse(PacketType.S_SetPlayerHp, {
        hp: this.user.stat.hp,
      }),
    );
    this.socket.write(
      createResponse(PacketType.S_SetPlayerMp, {
        mp: this.user.stat.mp,
      }),
    );

    // 마나 회복 로직 전달
    const increaseManaBattleLogResponse = createResponse(PacketType.S_BattleLog, {
      battleLog: {
        msg: `${this.user.getAddMsg()} 체력이 ${this.user.stat.hp - existingHp}만큼 회복하였습니다. \n마나가 ${this.user.stat.mp - existingMp}만큼 회복하였습니다.`,
        typingAnimation: false,
        btns: [
          { msg: '확인', enable: true }, // 플레이어 확인용 버튼
        ],
      },
    });
    this.socket.write(increaseManaBattleLogResponse);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
    if (responseCode === 1) {
      if (this.user.turnOff) {
        this.user.turnOff = false;
        this.changeState(EnemyAttackState);
        return;
      }
      this.changeState(ActionState); // 플레이어 확인 후 다음 상태로 전환
    } else {
      // 유효하지 않은 응답 처리
      invalidResponseCode(this.socket);
    }
  }
}
