// src/handler/boss/states/combat/bossPlayerDeadState.js

import { BOSS_STATUS, PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import BossGameOverLoseState from '../result/bossGameOverLoseState.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';

const BOSS_USER_COUNT = 3;
const RESPONSE_CODE = {
  SCREEN_TEXT_DONE: 1,
};

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class BossPlayerDeadState extends BossRoomState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null; // 타이머 식별자 초기화
    this.timerMgr = serviceLocator.get(TimerManager);
  }

  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.PLAYER_DEAD;

    const playerDeadBattleLogResponse = createResponse(PacketType.S_BossBattleLog, {
      battleLog: {
        msg: `체력이 0이 되어 사망하였습니다. \n팀원들을 믿고 기다리세요`,
        typingAnimation: false,
        btns: [{ msg: '화이팅', enable: false }],
      },
    });

    const deadUsers = this.users.filter((u) => u.stat.hp <= 0);

    deadUsers.forEach((user) => {
      user.socket.write(playerDeadBattleLogResponse);
      user.isDead = true;
    });

    if (deadUsers.length === BOSS_USER_COUNT) {
      this.bossRoom.clearTurnTimer();
      const allDeadBattleLogResponse = createResponse(PacketType.S_BossBattleLog, {
        battleLog: {
          msg: `모든 유저가 사망하였습니다.`,
          typingAnimation: false,
          btns: BUTTON_CONFIRM,
        },
      });
      this.user.socket.write(allDeadBattleLogResponse);
    }

    // 타이머 매니저를 통해 타이머 설정
    this.timeoutId = this.timerMgr.requestTimer(PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT, () => {
      this.handleInput(1);
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
