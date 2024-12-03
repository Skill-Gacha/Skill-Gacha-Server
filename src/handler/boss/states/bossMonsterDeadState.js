// src/handler/boss/states/bossMonsterDeadState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossGameOverWinState from './bossGameOverWinState.js';
import { delay } from '../../../utils/delay.js';

const DEATH_ANIMATION_CODE = 4;
const DEFEAT_DELAY = 4000;

export default class BossMonsterDeadState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.MONSTER_DEAD;
    const boss = this.bossRoom.monsters[0];

    // 보스 몬스터에 사망 애니메이션 전송
    this.users.forEach((user) => {
      user.socket.write(
        createResponse(PacketType.S_BossMonsterAction, {
          playerIds: [],
          actionMonsterIdx: boss.monsterIdx,
          actionSet: {
            animCode: DEATH_ANIMATION_CODE,
            effectCode: null,
          },
        }),
      );
    });

    await delay(DEFEAT_DELAY);

    this.changeState(BossGameOverWinState);
  }

  async handleInput(responseCode) {}
}
