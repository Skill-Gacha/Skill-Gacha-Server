// src/handler/boss/states/bossIncreaseManaState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossRoomState from './bossRoomState.js';
import BossTurnChangeState from './bossTurnChangeState.js';

const HP_RECOVERY_MIN = 5;
const HP_RECOVERY_MAX = 10;
const MP_RECOVERY_MIN = 5;
const MP_RECOVERY_MAX = 10;

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class BossIncreaseManaState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.INCREASE_MANA;
    const randomHp =
      Math.floor(Math.random() * (HP_RECOVERY_MAX - HP_RECOVERY_MIN + 1)) + HP_RECOVERY_MIN;
    const randomMp =
      Math.floor(Math.random() * (MP_RECOVERY_MAX - MP_RECOVERY_MIN + 1)) + MP_RECOVERY_MIN;

    const existingHp = this.user.stat.hp;
    const existingMp = this.user.stat.mp;

    this.user.increaseHpMp(randomHp, randomMp);

    // 모든 유저에게 HP, MP 변화 알림
    const hpResponse = createResponse(PacketType.S_BossPlayerStatusNotification, {
      playerId: [this.user.id],
      hp: [this.user.stat.hp],
      mp: [this.user.stat.mp],
    });

    this.users.forEach((user) => {
      user.socket.write(hpResponse);
    });

    const battleLogMsg = `${this.user.getAddMsg()} 체력이 ${this.user.stat.hp - existingHp}만큼 회복하였습니다. \n마나가 ${this.user.stat.mp - existingMp}만큼 회복하였습니다.`;

    // 마나 회복 로직 전달
    const increaseManaBattleLogResponse = createResponse(PacketType.S_BattleLog, {
      battleLog: {
        msg: battleLogMsg,
        typingAnimation: false,
        btns: BUTTON_CONFIRM,
      },
    });
    this.user.socket.write(increaseManaBattleLogResponse);

    // 5초 후에 handleInput(1)을 자동으로 호출하는 타이머 설정
    // this.timeoutId = setTimeout(() => {
    //   this.handleInput(1);
    // }, PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT); // ms
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      clearTimeout(this.timeoutId);
      this.changeState(BossTurnChangeState);
    } else {
      // 유효하지 않은 응답 처리
      invalidResponseCode(this.user.socket);
    }
  }
}
