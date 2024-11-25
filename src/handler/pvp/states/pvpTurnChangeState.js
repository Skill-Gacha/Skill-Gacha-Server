// src/handler/pvp/states/pvpTurnChangeState.js

import PvpActionState from './pvpActionState.js';
import PvpState from './pvpState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';
import { PVP_STATUS } from '../../../constants/battle.js';

export default class PvpTurnChangeState extends PvpState {
  enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.TURN_CHANGE;

    // 턴 전환
    this.pvpRoom.setUserTurn();

    // 양쪽 유저에게 턴 정보 전달
    this.mover.socket.write(
      createResponse(PacketType.S_UserTurn, { userTurn: false }),
    );

    this.stopper.socket.write(
      createResponse(PacketType.S_UserTurn, { userTurn: true }),
    );

    // 배틀 로그 전송
    const moverBattleLog = {
      msg: '이제 님이 때릴 차례예요',
      typingAnimation: false,
      btns: [
        { msg: '스킬 사용', enable: false },
        { msg: '아이템 사용', enable: false },
        { msg: '도망치기', enable: false },
      ],
    };

    const stopperBattleLog = {
      msg: '이제 님이 맞을 차례예요',
      typingAnimation: false,
      btns: [
        { msg: '스킬 사용', enable: true },
        { msg: '아이템 사용', enable: true },
        { msg: '도망치기', enable: true },
      ],
    };

    this.mover.socket.write(
      createResponse(PacketType.S_PvpBattleLog, { battleLog: moverBattleLog }),
    );

    this.stopper.socket.write(
      createResponse(PacketType.S_PvpBattleLog, { battleLog: stopperBattleLog }),
    );

    // 다음 상태로 전환하면서 mover와 stopper 교체
    this.changeState(PvpActionState, true);
  }

  handleInput(responseCode) {
    // 입력 처리 없는 State
  }
}
