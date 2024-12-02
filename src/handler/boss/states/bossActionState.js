// src/handler/boss/states/bossActionState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossRoomState from './bossRoomState.js';
import BossSkillChoiceState from './bossSkillChoiceState.js';
import BossItemChoiceState from './bossItemChoiceState.js';
import BossIncreaseManaState from './bossIncreaseManaState.js';

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];

export default class BossActionState extends BossRoomState {
  enter() {
    console.log('BossActionState 넘어왔다.');
    this.bossRoom.bossRoomStatus = BOSS_STATUS.ACTION;
    if (this.bossRoom.gameStart) {
      const battleLog = {
        msg: '행동을 선택해주세요.',
        typingAnimation: false,
        btns: BUTTON_OPTIONS.map((msg) => ({ msg, enable: true })),
      };

      console.log('battleLog : ', battleLog);

      const response = createResponse(PacketType.S_BossBattleLog, { battleLog });

      console.log('response : ', response);

      this.user.socket.write(response);
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
      invalidResponseCode(user.socket);
      return;
    }
    this.changeState(SelectedState);
  }
}
