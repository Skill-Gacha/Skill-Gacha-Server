// src/handler/dungeon/states/actionState.js

import DungeonState from './dungeonState.js';
import ConfirmState from './confirmState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { CONFIRM_TYPE, DUNGEON_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import ItemChoiceState from './ItemChoiceState.js';
import IncreaseManaState from './increaseManaState.js';
import SkillChoiceState from './skillChoiceState.js';

export default class ActionState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.ACTION;
    const buttons = [
      { msg: '스킬 사용', enable: true },
      { msg: '아이템 사용', enable: true },
      { msg: '턴 넘기기', enable: true },
      { msg: '도망치기', enable: true },
    ];

    const battleLog = {
      msg: '행동을 선택해주세요.',
      typingAnimation: false,
      btns: buttons,
    };

    const actionChooseBattlelogResponse = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(actionChooseBattlelogResponse);
  }

  async handleInput(responseCode) {
    switch (responseCode) {
      case 1: // 스킬
        this.changeState(SkillChoiceState);
        break;
      case 2: // 아이템
        this.changeState(ItemChoiceState);
        break;
      case 3: // 턴 넘기기
        this.user.turnOff = true;
        this.changeState(IncreaseManaState);
        break;
      case 4: // 도망치기
        this.changeState(ConfirmState);
        await this.dungeon.currentState.setConfirm(
          CONFIRM_TYPE.FLEE,
          '추하게 빼실겁니까? 보유중인 골드를 잃게됩니다.',
        );
        break;
      default:
        // responseCode 유효성 검사
        invalidResponseCode(this.socket);
        break;
    }
  }
}
