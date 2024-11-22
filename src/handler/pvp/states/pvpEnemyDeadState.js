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
    // 맞는 유저 사망 애네메이션 전송(양쪽 유저 모두 전송)
    this.mover.socket.write(
      createResponse(PacketType.S_PvpEnemyAction, {
        actionSet: {
          animCode: 1, // 사망 애니메이션 코드
          effectCode: null,
        },
      }),
    );
    this.stopper.socket.write(
      createResponse(PacketType.S_PvpPlayerAction, {
        actionSet: {
          animCode: 1, // 사망 애니메이션 코드
          effectCode: null,
        },
      }),
    );
    await delay(4000);
    this.changeState(PvpGameOverState);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
