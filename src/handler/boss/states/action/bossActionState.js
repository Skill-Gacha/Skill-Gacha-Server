// src/handler/boss/states/action/bossActionState.js

import BossRoomState from '../base/bossRoomState.js';
import { BOSS_STATUS } from '../../../../constants/battle.js';
import BossSkillChoiceState from './bossSkillChoiceState.js';
import BossItemChoiceState from './bossItemChoiceState.js';
import BossIncreaseManaState from '../turn/bossIncreaseManaState.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import BossTurnChangeState from '../turn/bossTurnChangeState.js';
import { sendBossBattleLog } from '../../../../utils/battle/bossHelpers.js';

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];

export default class BossActionState extends BossRoomState {
  enter() {
    this.bossRoom.startTurnTimer();
    // 유저 버프 초기화
    this.users.forEach((user) => {
      user.isDead = false;
      user.buff = null;
      user.battleCry = false;
      user.berserk = false;
      user.dangerPotion = false;
      user.protect = false;
      user.downResist = false;
      user.completeTurn = false;
    });

    this.bossRoom.bossRoomStatus = BOSS_STATUS.ACTION;
    if (this.bossRoom.gameStart) {
      if (this.user.isDead === true) {
        this.changeState(BossTurnChangeState);
        return;
      }

      sendBossBattleLog(
        this.user,
        '당신의 차례입니다, 행동을 선택해주세요.',
        BUTTON_OPTIONS.map((msg) => ({ msg, enable: true })),
      );
    }
    this.bossRoom.gameStart = true;
  }

  async handleInput(responseCode) {
    const actionMap = {
      1: BossSkillChoiceState,
      2: BossItemChoiceState,
      3: BossIncreaseManaState,
    };

    const SelectedState = actionMap[responseCode];
    if (SelectedState === BossIncreaseManaState) {
      this.user.turnOff = true;
    }
    if (!SelectedState) {
      invalidResponseCode(this.user.socket);
      return;
    }
    this.changeState(SelectedState);
  }
}
