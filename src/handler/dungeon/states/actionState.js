// src/handler/dungeon/states/actionState.js

import DungeonState from './dungeonState.js';
import TargetState from './targetState.js';
import ConfirmState from './confirmState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { CONFIRM_TYPE, DUNGEON_STATUS } from '../../../constants/battle.js';

export default class ActionState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.ACTION;
    const buttons = [
      { msg: '공격', enable: true },
      { msg: '스킬 사용', enable: false }, // 향후 구현 예정
      { msg: '아이템 사용', enable: false }, // 향후 구현 예정
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
      case 1: // 공격 < 나중에 스킬이 공격을 완전히 대체해야 함
        this.changeState(TargetState);
        break;
      case 2: // 스킬
        break;
      case 3: // 아이템
        break;
      case 4: // 도망치기
        this.changeState(ConfirmState);
        await this.dungeon.currentState.setConfirm(CONFIRM_TYPE.FLEE, '추하게 빼실겁니까?');
        break;
      default:
        // 잘못된 입력 처리
        const invalidResponse = createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: '잘못된 선택입니다. 다시 선택해주세요.',
            typingAnimation: false,
            btns: [],
          },
        });
        this.socket.write(invalidResponse);
        break;
    }
  }
}
