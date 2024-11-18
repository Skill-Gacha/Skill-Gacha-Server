// src/handlers/dungeon/states/TargetState.js

import DungeonState from './dungeonState.js';
import PlayerAttackState from './playerAttackState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

export default class TargetState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.TARGET;
    const buttons = this.dungeon.monsters.map((monster) => ({
      msg: monster.monsterName,
      enable: monster.monsterHp > 0,
    }));

    const battleLog = {
      msg: '공격할 대상을 선택해주세요.',
      typingAnimation: false,
      btns: buttons,
    };

    this.socket.write(createResponse(PacketType.S_BattleLog, { battleLog }));
  }

  async handleInput(responseCode) {
    const monster = this.dungeon.monsters.find((m) => m.monsterIdx === responseCode - 1);
    if (monster && monster.monsterHp > 0) {
      this.dungeon.selectedMonster = monster;
      this.changeState(PlayerAttackState);
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
