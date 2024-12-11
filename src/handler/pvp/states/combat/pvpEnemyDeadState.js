// src/handler/pvp/states/pvpEnemyDeadState.js

import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { PVP_STATUS, PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT } from '../../../../constants/battle.js';
import PvpState from '../base/pvpState.js';
import PvpGameOverState from '../result/pvpGameOverState.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';

const DEATH_ANIMATION_CODE = 1;
const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class PvpEnemyDeadState extends PvpState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null; // 타이머 식별자 초기화
    this.timerMgr = serviceLocator.get(TimerManager);
  }
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.ENEMY_DEAD;

    const deathAnimation = {
      actionSet: { animCode: DEATH_ANIMATION_CODE, effectCode: null },
    };

    const enemyActionResponse = createResponse(PacketType.S_PvpEnemyAction, deathAnimation);
    const playerActionResponse = createResponse(PacketType.S_PvpPlayerAction, deathAnimation);

    this.mover.socket.write(enemyActionResponse);
    this.stopper.socket.write(playerActionResponse);

    const battleLogMsg = `상대방을 쓰러트렸습니다.`;

    const enemyDeadBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
      battleLog: {
        msg: battleLogMsg,
        typingAnimation: false,
        btns: BUTTON_CONFIRM,
      },
    });

    this.mover.socket.write(enemyDeadBattleLogResponse);

    // 타이머 매니저를 통해 타이머 설정
    this.timeoutId = this.timerMgr.requestTimer(PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT, () => {
      this.handleInput(1);
    });
  }

  handleInput(responseCode) {
    if (responseCode === 1) {
      if (this.timeoutId) {
        this.timerMgr.cancelTimer(this.timeoutId); // 타이머 취소
        this.timeoutId = null;
      }
      this.changeState(PvpGameOverState);
    } else {
      invalidResponseCode(this.mover.socket);
    }
  }
}
