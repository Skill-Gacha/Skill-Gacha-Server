// src/handler/boss/states/combat/bossPartyFailState.js

import BossRoomState from '../base/bossRoomState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import BossGameOverLoseState from '../result/bossGameOverLoseState.js';
import { BOSS_GAME_OVER_CONFIRM_TIMEOUT_LIMIT } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import TimerManager from '#managers/timerManager.js';
import serviceLocator from '#locator/serviceLocator.js';

const RESPONSE_CODE = {
  SCREEN_TEXT_DONE: 1,
};
const BUTTON_CONFIRM = [{ msg: '귀환 대기 중', enable: false }];

export default class BossPartyFailState extends BossRoomState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null; // 타이머 식별자 초기화
    this.timerMgr = serviceLocator.get(TimerManager);
  }

  async enter() {
    // 파티 전멸 로직 전달
    const partyDeadBattleLogResponse = createResponse(PacketType.S_BossBattleLog, {
      battleLog: {
        msg: `Null Dragon 토벌에 실패하였습니다.`,
        typingAnimation: false,
        btns: BUTTON_CONFIRM,
      },
    });
    this.users.forEach((user) => {
      user.socket.write(partyDeadBattleLogResponse);
    });

    // 타이머 매니저를 통해 타이머 설정
    this.timeoutId = this.timerMgr.requestTimer(BOSS_GAME_OVER_CONFIRM_TIMEOUT_LIMIT, () => {
      this.handleInput(RESPONSE_CODE.SCREEN_TEXT_DONE);
    });
  }

  async handleInput(responseCode) {
    if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE) {
      this.changeState(BossGameOverLoseState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
