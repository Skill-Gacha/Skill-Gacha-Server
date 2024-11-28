// src/handler/pvp/states/pvpIncreaseManaState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpState from './pvpState.js';
import PvpTurnChangeState from './pvpTurnChangeState.js';

export default class PvpIncreaseManaState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.INCREASE_MANA;
    const randomHp = Math.floor(Math.random() * 6) + 5;
    const randomMp = Math.floor(Math.random() * 6) + 5;

    const existingHp = this.mover.stat.hp;
    const existingMp = this.mover.stat.mp;

    this.mover.increaseHpMp(randomHp, randomMp);

    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerHp, { hp: this.mover.stat.hp }),
    );
    console.log(this.mover.stat.mp);
    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerMp, { mp: this.mover.stat.mp }),
    );
    this.stopper.socket.write(
      createResponse(PacketType.S_SetPvpEnemyHp, { hp: this.mover.stat.hp }),
    );

    // 마나 회복 로직 전달
    const increaseManaBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
      battleLog: {
        msg: `턴을 넘기셔서 체력이 ${this.mover.stat.hp - existingHp}만큼 회복하였습니다. \n마나가 ${this.mover.stat.mp - existingMp}만큼 회복하였습니다.`,
        typingAnimation: false,
        btns: [
          { msg: '확인', enable: true }, // 플레이어 확인용 버튼
        ],
      },
    });
    this.mover.socket.write(increaseManaBattleLogResponse);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
    if (responseCode === 1) {
      this.changeState(PvpTurnChangeState);
    } else {
      // 유효하지 않은 응답 처리
      invalidResponseCode(this.socket);
    }
  }
}
