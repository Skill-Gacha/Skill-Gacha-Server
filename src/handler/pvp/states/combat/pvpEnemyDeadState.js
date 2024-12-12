// src/handler/pvp/states/combat/pvpEnemyDeadState.js

import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { PVP_STATUS, PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT } from '../../../../constants/battle.js';
import PvpState from '../base/pvpState.js';
import PvpGameOverState from '../result/pvpGameOverState.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';

const DEATH_ANIMATION_CODE = 1;
const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

// 상대방(Stopper) 처치 상태
// 승리 직전 상태로, 확인 입력 후 GameOverState로 전환
export default class PvpEnemyDeadState extends PvpState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null;
    this.timerMgr = serviceLocator.get(TimerManager);
  }

  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.ENEMY_DEAD;

    const deathAnimation = {
      actionSet: { animCode: DEATH_ANIMATION_CODE, effectCode: null }
    };

    // 상대 사망 애니메이션 전송
    this.mover.socket.write(createResponse(PacketType.S_PvpEnemyAction, deathAnimation));
    this.stopper.socket.write(createResponse(PacketType.S_PvpPlayerAction, deathAnimation));

    const battleLogMsg = '상대방을 쓰러트렸습니다.';
    this.mover.socket.write(
      createResponse(PacketType.S_PvpBattleLog, {
        battleLog: { msg: battleLogMsg, typingAnimation: false, btns: BUTTON_CONFIRM }
      })
    );

    // 일정 시간 후 자동 진행 위해 타이머 설정
    this.timeoutId = this.timerMgr.requestTimer(PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT, () => {
      this.handleInput(1); // 확인으로 간주
    });
  }

  handleInput(responseCode) {
    if (responseCode === 1) {
      if (this.timeoutId) {
        this.timerMgr.cancelTimer(this.timeoutId);
        this.timeoutId = null;
      }
      this.changeState(PvpGameOverState);
    } else {
      invalidResponseCode(this.mover.socket);
    }
  }
}
