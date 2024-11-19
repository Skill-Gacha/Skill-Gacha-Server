// src/handler/dungeon/states/targetState.js

import DungeonState from './dungeonState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import SkillChoiceState from './skillchoiceState.js';
import { invalidResponseCode } from '../../../utils/error/responseErrorHandler.js';

// 공격할 대상을 고르는 상태
// '공격'을 누르고 공격할 몬스터를 선택하기 위한 상태
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
      this.changeState(SkillChoiceState);
    } else {
      // responseCode 유효성 검사
      invalidResponseCode(this.socket);
    }
  }
}
