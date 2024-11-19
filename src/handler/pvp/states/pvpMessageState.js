import PvpState from './pvpState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpActionState from './pvpActionState.js';

export default class PvpMessageState extends PvpState {
  constructor(pvp, user, socket, message) {
    super(pvp, user, socket);
    this.message = message || '메시지를 표시합니다.';
  }

  async enter() {
    this.pvp.pvpStatus = PVP_STATUS.MESSAGE;
  }

  async handleInput(responseCode) {
    if (responseCode === 0) {
      // S_ScreenDone 패킷 전송
      const screenTextDoneResponse = createResponse(PacketType.S_ScreenDone, {});
      this.socket.write(screenTextDoneResponse);

      // 행동 선택 상태로 전환
      this.changeState(PvpActionState);
    }
  }
}
