// src/handler/dungeon/states/increaseManaState.js

import DungeonState from './dungeonState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import ActionState from './actionState.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';

export default class IncreaseManaState extends DungeonState {
  async enter() {
    const randomHp = Math.floor(Math.random() * 3);
    const randomMp = Math.floor(Math.random() * 3);

    this.user.increaseState(randomHp, randomMp);

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
        msg: `체력이 ${randomHp}만큼 회복하였습니다. \n마나가 ${randomMp}만큼 회복하였습니다.`,
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
      this.changeState(ActionState); // 플레이어 확인 후 다음 상태로 전환
    } else {
      // 유효하지 않은 응답 처리
      invalidResponseCode(this.socket);
    }
  }
}
