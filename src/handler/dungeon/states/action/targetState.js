// src/handler/dungeon/states/targetState.js

import DungeonState from '../base/dungeonState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../../constants/battle.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import PlayerAttackState from '../combat/playerAttackState.js';

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
    const selectedMonster = this.getSelectedMonster(responseCode);

    if (!selectedMonster) {
      invalidResponseCode(this.user.socket);
      return;
    }

    this.dungeon.selectedMonster = selectedMonster;
    this.changeState(PlayerAttackState);
  }

  getSelectedMonster(code) {
    const monsterIdx = code - 1;
    const monster = this.dungeon.monsters.find(
      (m) => m.monsterIdx === monsterIdx && m.monsterHp > 0,
    );
    return monster || null;
  }
}
