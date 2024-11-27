// src/handler/dungeon/states/playerDeadState.js

import DungeonState from './dungeonState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import GameOverLoseState from './gameOverLoseState.js';
import { deadResource } from '../../../utils/battle/calculate.js';

export default class PlayerDeadState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.PALYER_DEAD;
    const gold = this.user.gold;
    const stone = this.user.stone;

    // 단계 별 골드 및 강화석 감소
    deadResource(this.user, this.dungeon.dungeonCode);

    // 플레이어 사망 로직 전달
    const PlayerDeadBattleLogResponse = createResponse(PacketType.S_BattleLog, {
      battleLog: {
        msg: `체력이 0이 되어 사망하였습니다. \n골드를 ${gold - this.user.gold}원 잃었습니다 \n강화석 ${stone - this.user.stone}개 잃었습니다.`,
        typingAnimation: false,
        btns: [
          { msg: '확인', enable: true }, // 플레이어 확인용 버튼
        ],
      },
    });
    this.socket.write(PlayerDeadBattleLogResponse);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
    if (responseCode === 1) {
      this.changeState(GameOverLoseState); // 플레이어 확인 후 다음 상태로 전환
    } else {
      // 유효하지 않은 응답 처리
      invalidResponseCode(this.socket);
    }
  }
}
