// src/handler/boss/states/action/bossActionState.js

import BossRoomState from '../base/bossRoomState.js';
import { PacketType } from '../../../../constants/header.js';
import { BOSS_STATUS } from '../../../../constants/battle.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import BossSkillChoiceState from './bossSkillChoiceState.js';
import BossItemChoiceState from './bossItemChoiceState.js';
import BossIncreaseManaState from '../turn/bossIncreaseManaState.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];

export default class BossActionState extends BossRoomState {
  enter() {
    this.bossRoom.startTurnTimer();
    this.bossRoom.bossRoomStatus = BOSS_STATUS.ACTION;
    if (this.bossRoom.gameStart) {
      if (this.user.isDead === true) {
        this.changeState(BossIncreaseManaState);
        return;
      }

      this.users.forEach((user) => {
        const battleLog = {
          msg: `${this.user.nickname}님의 차례입니다, 행동을 선택해주세요.`,
          typingAnimation: false,
          btns: BUTTON_OPTIONS.map((msg) => ({ msg, enable: this.user === user })),
        };
        user.socket.write(createResponse(PacketType.S_BossBattleLog, { battleLog }));
      });
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
