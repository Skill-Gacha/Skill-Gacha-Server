// src/handler/pvp/states/pvpEnemyDeadState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpState from './pvpState.js';
import PvpGameOverState from './pvpGameOverState.js';
import { delay } from '../../../utils/delay.js';

export default class PvpEnemyDeadState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.ENEMY_DEAD;

    // 상대방에게 사망 애니메이션 전송
    const deathAnimation = {
      actionSet: { animCode: 1, effectCode: null },
    };

    this.mover.socket.write(createResponse(PacketType.S_PvpEnemyAction, deathAnimation));
    this.stopper.socket.write(createResponse(PacketType.S_PvpPlayerAction, deathAnimation));

    await delay(4000);

    this.changeState(PvpGameOverState);
  }

  handleInput(responseCode) {
    // 입력 처리 없는 State
  }
}
