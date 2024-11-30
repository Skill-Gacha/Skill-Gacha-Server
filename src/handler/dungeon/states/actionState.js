// src/handler/dungeon/states/actionState.js

import DungeonState from './dungeonState.js';
import ConfirmState from './confirmState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { CONFIRM_TYPE, DUNGEON_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import ItemChoiceState from './itemChoiceState.js';
import IncreaseManaState from './increaseManaState.js';
import SkillChoiceState from './skillChoiceState.js';

const ACTION_BUTTONS = [
  { msg: '스킬 사용', enable: true },
  { msg: '아이템 사용', enable: true },
  { msg: '턴 넘기기', enable: true },
  { msg: '도망치기', enable: true },
];

const ACTIONS = {
  SKILL: 1,
  ITEM: 2,
  PASS_TURN: 3,
  FLEE: 4,
};

export default class ActionState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.ACTION;

    const battleLog = {
      msg: '행동을 선택해주세요.',
      typingAnimation: false,
      btns: ACTION_BUTTONS,
    };

    const response = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(response);
  }

  async handleInput(responseCode) {
    switch (responseCode) {
      case ACTIONS.SKILL: // 스킬
        this.changeState(SkillChoiceState);
        break;
      case ACTIONS.ITEM: // 아이템
        this.changeState(ItemChoiceState);
        break;
      case ACTIONS.PASS_TURN: // 턴 넘기기
        this.user.turnOff = true;
        this.changeState(IncreaseManaState);
        break;
      case ACTIONS.FLEE: // 도망치기
        this.changeState(ConfirmState);
        await this.dungeon.currentState.setConfirm(
          CONFIRM_TYPE.FLEE,
          '추하게 빼실겁니까? 보유중인 골드 중 일부를 잃게됩니다.',
        );
        break;
      default:
        // 유효하지 않은 응답 처리
        invalidResponseCode(this.socket);
        break;
    }
  }
}
