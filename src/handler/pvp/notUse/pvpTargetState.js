// src/handler/pvp/states/pvpTargetState.js

import PvpState from '../states/pvpState.js';
import PvpPlayerAttackState from '../states/pvpPlayerAttackState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';

// 공격할 대상을 고르는 상태
// '공격'을 누르고 공격할 몬스터를 선택하기 위한 상태
export default class PvpTargetState extends PvpState {
  async enter() {
    this.pvp.pvpStatus = PVP_STATUS.TARGET;
    const buttons = this.pvp.getOpponentUsers().map((user) => ({
      msg: user.nickname,
      enable: user.stats.hp > 0,
    }));

    const battleLog = {
      msg: '공격할 대상을 선택해주세요.',
      typingAnimation: false,
      btns: buttons,
    };

    this.socket.write(createResponse(PacketType.S_BattleLog, { battleLog }));
  }

  async handleInput(responseCode) {
    const monster = this.pvp.getOpponentUsers().find((user) => m.monsterIdx === responseCode - 1);
    if (monster && monster.monsterHp > 0) {
      this.pvp.selectedMonster = monster;
      this.changeState(PvpPlayerAttackState);
    } else {
      // 유효하지 않은 대상 선택 처리
      const invalidResponse = createResponse(PacketType.S_BattleLog, {
        battleLog: {
          msg: '유효하지 않은 대상입니다. 다시 선택해주세요.',
          typingAnimation: false,
          btns: [],
        },
      });
      this.socket.write(invalidResponse);
    }
  }
}
