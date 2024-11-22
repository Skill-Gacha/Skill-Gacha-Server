// src/handler/pvp/states/pvpTurnChangeState.js

import PvpConfirmState from './pvpConfirmState.js';
import { CONFIRM_TYPE, PVP_STATUS } from '../../../constants/battle.js';
import PvpState from './pvpState.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import PvpSkillChoice from './pvpSkillChoiceState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';

export default class PvpTurnChangeState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.TURN_CHANGE;

    // 양쪽 유저에게 턴 패킷 전달(기존 mover에게는 false, stopper에게는 true)하여 턴 바꿔주기
    this.mover.socket.write(
      createResponse(PacketType.S_UserTurn, {
        userTurn: false,
      }),
    );

    this.stopper.socket.write(
      createResponse(PacketType.S_UserTurn, {
        userTurn: true,
      }),
    );

    const stopperBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
      battleLog: {
        msg: `이제 님이 때릴 차례에요`,
        typingAnimation: false,
        btns: [
          { msg: '스킬 사용', enable: true }, // 향후 구현 예정
          { msg: '아이템 사용', enable: true }, // 향후 구현 예정
          { msg: '도망치기', enable: true },
        ],
      },
    });

    const moverBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
      battleLog: {
        msg: `이제 님이 맞을 차례에요`,
        typingAnimation: false,
        btns: [
          { msg: '스킬 사용', enable: false }, // 향후 구현 예정
          { msg: '아이템 사용', enable: false }, // 향후 구현 예정
          { msg: '도망치기', enable: false },
        ],
      },
    });

    this.stopper.socket.write(stopperBattleLogResponse);
    this.mover.socket.write(moverBattleLogResponse);

    // 턴 전환
    this.pvpRoom.setUserTurn();
  }

  async handleInput(responseCode) {
    console.log(responseCode);
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
    switch (responseCode) {
      case 1: // 스킬
        this.changeState(PvpSkillChoice);
        break;
      case 2: // 아이템
        break;
      case 3: // 도망치기
        this.changeState(PvpConfirmState);
        await this.dungeon.currentState.setConfirm(CONFIRM_TYPE.FLEE, '추하게 빼실겁니까?');
        break;
      default:
        // responseCode 유효성 검사
        invalidResponseCode(this.socket);
        break;
    }
  }
}
