// src/handler/pvp/states/pvpEnemyDeadState.js

import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../../constants/battle.js';
import PvpState from '../base/pvpState.js';
import PvpGameOverState from '../result/pvpGameOverState.js';
import { delay } from '../../../../utils/delay.js';

const DEATH_ANIMATION_CODE = 1;
const DEFEAT_DELAY = 4000;

export default class PvpEnemyDeadState extends PvpState {
  async enter() {
    this.pvpRoom.pvpStatus = PVP_STATUS.ENEMY_DEAD;

    const deathAnimation = {
      actionSet: { animCode: DEATH_ANIMATION_CODE, effectCode: null },
    };

    const enemyActionResponse = createResponse(PacketType.S_PvpEnemyAction, deathAnimation);
    const playerActionResponse = createResponse(PacketType.S_PvpPlayerAction, deathAnimation);

    this.mover.socket.write(enemyActionResponse);
    this.stopper.socket.write(playerActionResponse);

    await delay(DEFEAT_DELAY);

    this.changeState(PvpGameOverState);
  }

  handleInput(responseCode) {
  }
}
