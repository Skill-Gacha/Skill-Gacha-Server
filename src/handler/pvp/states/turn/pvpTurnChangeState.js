// src/handler/pvp/states/turn/pvpTurnChangeState.js

import PvpActionState from '../action/pvpActionState.js';
import PvpState from '../base/pvpState.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { PacketType } from '../../../../constants/header.js';
import { PVP_STATUS } from '../../../../constants/battle.js';

// 턴 전환 상태
// 턴을 전환한 뒤 ActionState로 넘어가되, mover와 stopper를 스위칭하여 다음 플레이어가 공격자로
const TURN_CHANGE_BUTTONS_MOVER = [
  { msg: '스킬 사용', enable: false },
  { msg: '아이템 사용', enable: false },
  { msg: '도망치기', enable: false },
];

const TURN_CHANGE_BUTTONS_STOPPER = [
  { msg: '스킬 사용', enable: true },
  { msg: '아이템 사용', enable: true },
  { msg: '도망치기', enable: true },
];

const TURN_CHANGE_MESSAGES = {
  mover: '이제 님이 맞을 차례예요',
  stopper: '이제 님이 때릴 차례예요',
};

export default class PvpTurnChangeState extends PvpState {
  enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.TURN_CHANGE;

    // 턴 전환
    this.pvpRoom.switchTurn();

    // 유저 턴 정보 전송
    this.mover.socket.write(createResponse(PacketType.S_UserTurn, { userTurn: false }));
    this.stopper.socket.write(createResponse(PacketType.S_UserTurn, { userTurn: true }));

    // 배틀 로그 전송
    const moverBattleLog = {
      msg: TURN_CHANGE_MESSAGES.mover,
      typingAnimation: false,
      btns: TURN_CHANGE_BUTTONS_MOVER,
    };

    const stopperBattleLog = {
      msg: TURN_CHANGE_MESSAGES.stopper,
      typingAnimation: false,
      btns: TURN_CHANGE_BUTTONS_STOPPER,
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog: moverBattleLog }));
    this.stopper.socket.write(createResponse(PacketType.S_PvpBattleLog, { battleLog: stopperBattleLog }));

    // 턴 교체하면서 State 변경
    this.changeState(PvpActionState, true);

    // 타이머 관리
    this.pvpRoom.clearTurnTimer();
    this.pvpRoom.startTurnTimer();
    this.pvpRoom.lastActivity = Date.now();
  }

  handleInput() {
    // 이 상태는 입력 처리 없음
  }
}
