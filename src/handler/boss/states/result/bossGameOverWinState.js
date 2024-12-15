// src/handler/boss/states/result/bossGameOverWinState.js

import { BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import { sendBossScreenText } from '../../../../utils/battle/bossHelpers.js';
import { updateUserResource } from '../../../../db/user/userDb.js';

const REWARD_GOLD_AMOUNT = 1000000;
const REWARD_STONE_AMOUNT = 1000;

export default class BossGameOverWinState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.GAME_OVER_WIN;
    this.bossRoom.clearTurnTimer();

    // 보상 추가
    await Promise.all(
      this.users.map(async (user) => {
        user.increaseResource(REWARD_GOLD_AMOUNT, REWARD_STONE_AMOUNT);
        await updateUserResource(user.nickname, user.gold, user.stone);
      }),
    );

    sendBossScreenText(
      this.users,
      `축하합니다. Null Dragon을 무찌르는데 성공하셨습니다. \n ${REWARD_GOLD_AMOUNT.toLocaleString('ko-KR')}골드와 강화석 ${REWARD_GOLD_AMOUNT.toLocaleString('ko-KR')}개를 획득 하셨습니다.`,
    );
  }

  async handleInput(responseCode) {
  }
}
