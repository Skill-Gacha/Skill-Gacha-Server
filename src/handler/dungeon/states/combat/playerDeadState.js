// src/handler/dungeon/states/playerDeadState.js

import DungeonState from '../base/dungeonState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import GameOverLoseState from '../result/gameOverLoseState.js';
import { deadResource } from '../../../../utils/battle/calculate.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';

const RESPONSE_CODE = {
  SCREEN_TEXT_DONE: 1,
};

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];

export default class PlayerDeadState extends DungeonState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null; // 타이머 식별자 초기화
    this.timerMgr = serviceLocator.get(TimerManager);
  }
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.PLAYER_DEAD;
    const gold = this.user.gold;
    const stone = this.user.stone;

    // 단계 별 골드 및 강화석 감소
    deadResource(this.user, this.dungeon.dungeonCode);

    const goldLost = gold - this.user.gold;
    const stoneLost = stone - this.user.stone;

    // 플레이어 사망 로직 전달
    const playerDeadBattleLogResponse = createResponse(PacketType.S_BattleLog, {
      battleLog: {
        msg: `체력이 0이 되어 사망하였습니다.\n골드를 ${goldLost}원 잃었습니다.\n강화석 ${stoneLost}개 잃었습니다.`,
        typingAnimation: false,
        btns: BUTTON_CONFIRM,
      },
    });
    this.socket.write(playerDeadBattleLogResponse);

    // 타이머 매니저를 통해 타이머 설정
    this.timeoutId = this.timerMgr.requestTimer(PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT, () => {
      this.handleInput(1);
    });
  }

  async handleInput(responseCode) {
    if (responseCode === RESPONSE_CODE.SCREEN_TEXT_DONE) {
      this.changeState(GameOverLoseState);
    } else {
      invalidResponseCode(this.socket);
    }
  }
}
