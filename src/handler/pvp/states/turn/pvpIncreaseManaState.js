// src/handler/pvp/states/pvpIncreaseManaState.js

import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { PVP_STATUS, PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT } from '../../../../constants/battle.js';
import PvpState from '../base/pvpState.js';
import PvpTurnChangeState from './pvpTurnChangeState.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js'; // 중앙 타이머 서비스 임포트

const HP_RECOVERY_MIN = 5;
const HP_RECOVERY_MAX = 10;
const MP_RECOVERY_MIN = 5;
const MP_RECOVERY_MAX = 10;

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class PvpIncreaseManaState extends PvpState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null; // 타이머 식별자 초기화
    this.timerMgr = serviceLocator.get(TimerManager);
  }

  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.INCREASE_MANA;
    const randomHp = Math.floor(Math.random() * (HP_RECOVERY_MAX - HP_RECOVERY_MIN + 1)) + HP_RECOVERY_MIN;
    const randomMp = Math.floor(Math.random() * (MP_RECOVERY_MAX - MP_RECOVERY_MIN + 1)) + MP_RECOVERY_MIN;

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

    // 타이머 매니저를 통해 타이머 설정
    this.timeoutId = this.timerMgr.requestTimer(PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT, () => {
      this.handleInput(1);
    });
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      if (this.timeoutId) {
        this.timerMgr.cancelTimer(this.timeoutId); // 타이머 취소
        this.timeoutId = null;
      }
      this.changeState(PvpTurnChangeState);
    } else {
      invalidResponseCode(this.mover.socket);
    }
  }
}
