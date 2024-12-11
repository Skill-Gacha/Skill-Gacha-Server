// src/handler/boss/states/result/bossMonsterDeadState.js

import { BOSS_GAME_OVER_CONFIRM_TIMEOUT_LIMIT, BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import BossGameOverWinState from './bossGameOverWinState.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';

const DEATH_ANIMATION_CODE = 4;
const BOSS_INDEX = 0;
const RESPONSE_CODE = {
  SCREEN_TEXT_DONE: 1,
};
const BUTTON_CONFIRM = [{ msg: '귀환 대기 중', enable: false }];

export default class BossMonsterDeadState extends BossRoomState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null; // 타이머 식별자 초기화
    this.timerMgr = serviceLocator.get(TimerManager);
  }

  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.MONSTER_DEAD;
    const boss = this.bossRoom.monsters[BOSS_INDEX];

    this.users.forEach((user) => {
      user.socket.write(
        createResponse(PacketType.S_BossMonsterAction, {
          playerIds: [],
          actionMonsterIdx: boss.monsterIdx,
          actionSet: {
            animCode: DEATH_ANIMATION_CODE,
            effectCode: null,
          },
        }),
      );
    });

    // 파티 전멸 로직 전달
    const partyWinBattleLogResponse = createResponse(PacketType.S_BossBattleLog, {
      battleLog: {
        msg: `Null Dragon이 힘을 잃고 쓰러집니다.`,
        typingAnimation: false,
        btns: BUTTON_CONFIRM,
      },
    });
    this.users.forEach((user) => {
      user.socket.write(partyWinBattleLogResponse);
    });

    // 타이머 매니저를 통해 타이머 설정
    this.timeoutId = this.timerMgr.requestTimer(BOSS_GAME_OVER_CONFIRM_TIMEOUT_LIMIT, () => {
      this.handleInput(RESPONSE_CODE.SCREEN_TEXT_DONE);
    });
  }

  async handleInput(responseCode) {
    if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE) {
      this.changeState(BossGameOverWinState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
