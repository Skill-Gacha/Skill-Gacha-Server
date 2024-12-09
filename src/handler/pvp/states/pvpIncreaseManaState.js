// src/handler/pvp/states/pvpIncreaseManaState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { PVP_STATUS, PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT } from '../../../constants/battle.js';
import PvpState from './pvpState.js';
import PvpTurnChangeState from './pvpTurnChangeState.js';

const HP_RECOVERY_MIN = 5;
const HP_RECOVERY_MAX = 10;
const MP_RECOVERY_MIN = 5;
const MP_RECOVERY_MAX = 10;

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class PvpIncreaseManaState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.INCREASE_MANA;
    const randomHp =
      Math.floor(Math.random() * (HP_RECOVERY_MAX - HP_RECOVERY_MIN + 1)) + HP_RECOVERY_MIN;
    const randomMp =
      Math.floor(Math.random() * (MP_RECOVERY_MAX - MP_RECOVERY_MIN + 1)) + MP_RECOVERY_MIN;

    const existingHp = this.mover.stat.hp;
    const existingMp = this.mover.stat.mp;

    this.mover.increaseHpMp(randomHp, randomMp);

    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerHp, { hp: this.mover.stat.hp }),
    );

    this.mover.socket.write(
      createResponse(PacketType.S_SetPvpPlayerMp, { mp: this.mover.stat.mp }),
    );

    this.stopper.socket.write(
      createResponse(PacketType.S_SetPvpEnemyHp, { hp: this.mover.stat.hp }),
    );

    const battleLogMsg = `턴을 넘기며 체력이 ${this.mover.stat.hp - existingHp}만큼 회복 되었습니다. \n마나가 ${this.mover.stat.mp - existingMp}만큼 회복 되었습니다.`;

    const increaseManaBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
      battleLog: {
        msg: battleLogMsg,
        typingAnimation: false,
        btns: BUTTON_CONFIRM,
      },
    });

    this.mover.socket.write(increaseManaBattleLogResponse);

    // 5초 후에 handleInput(1)을 자동으로 호출하는 타이머 설정
    this.timeoutId = setTimeout(() => {
      this.handleInput(1);
    }, PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT); // ms
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      clearTimeout(this.timeoutId);
      this.changeState(PvpTurnChangeState);
    } else {
      // 유효하지 않은 응답 처리
      invalidResponseCode(this.mover.socket);
    }
  }
}
