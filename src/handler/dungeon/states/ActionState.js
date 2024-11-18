﻿// src/handlers/dungeon/states/ActionState.js

import DungeonState from './DungeonState.js';
import TargetState from './TargetState.js';
import ConfirmState from './ConfirmState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';

export default class ActionState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = 'ACTION';
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

    const response = createResponse(PacketType.S_BattleLog, { battleLog });
    this.socket.write(response);
  }

  async handleInput(responseCode) {
    switch (responseCode) {
      case 1: // 공격
        this.changeState(TargetState);
        break;
      case 2: // 스킬
        break;
      case 3: // 아이템
        break;
      case 4: // 도망치기
        this.changeState(ConfirmState);
        await this.dungeon.currentState.setConfirm('FLEE', '정말로 도망치시겠습니까?');
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
