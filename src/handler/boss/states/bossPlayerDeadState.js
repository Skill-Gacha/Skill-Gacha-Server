// src/handler/boss/states/bossPlayerDeadState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossGameOverLoseState from './bossGameOverLoseState.js';
import { delay } from '../../../utils/delay.js';

const GAMEOVER_DELAY = 4000;
const BOSS_USER_COUNT = 3;

export default class BossPlayerDeadState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.PLAYER_DEAD;

    // 플레이어 사망 로직 전달
    const playerDeadBattleLogResponse = createResponse(PacketType.S_BossBattleLog, {
      battleLog: {
        msg: `체력이 0이 되어 사망하였습니다. \n팀원들을 믿고 기다리세요`,
        typingAnimation: false,
        btns: [
          { msg: '화이팅', enable: false }, // 플레이어 확인용 버튼
        ],
      },
    });

    const deadUsers = this.users.filter((u) => u.stat.hp <= 0);

    deadUsers.forEach((user) => {
      user.socket.write(playerDeadBattleLogResponse);
      user.isDead = true;
    });

    if (deadUsers.length === BOSS_USER_COUNT) {
      await delay(GAMEOVER_DELAY);
      this.changeState(BossGameOverLoseState);
    }
  }

  async handleInput(responseCode) {}
}
