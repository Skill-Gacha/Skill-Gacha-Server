// src/handlers/dungeon/states/ConfirmState.js

import DungeonState from './DungeonState.js';
import ActionState from './ActionState.js';
import FleeMessageState from './FleeMessageState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';

export default class ConfirmState extends DungeonState {
  constructor(dungeon, user, socket) {
    super(dungeon, user, socket);
    this.confirmType = 'DEFAULT';
    this.message = '확인';
  }

  async setConfirm(type, message) {
    this.confirmType = type;
    this.message = message;
    await this.enter();
  }

  async enter() {
    this.dungeon.dungeonStatus = 'CONFIRM';
    const buttons = [
      { msg: '예', enable: true },
      { msg: '아니오', enable: true },
    ];

    const battleLog = {
      msg: this.message,
      typingAnimation: false,
      btns: buttons,
    };

    this.socket.write(createResponse(PacketType.S_BattleLog, { battleLog }));
  }

  async handleInput(responseCode) {
    switch (this.confirmType) {
      case 'FLEE':
        if (responseCode === 1) {
          this.changeState(FleeMessageState);
        } else if (responseCode === 2) {
          this.changeState(ActionState);
        } else {
          // 잘못된 입력 처리
        }
        break;
      default:
        // 기타 확인 유형 처리
        break;
    }
  }
}
