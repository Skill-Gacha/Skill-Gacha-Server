// src/handler/boss/states/bossTargetState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';
import BossPlayerAttackState from './bossPlayerAttackState.js';

const BUTTON_CONFIRM = [{ msg: '확인', enable: true }];
// 공격할 대상을 선택하기 위한 버튼 목록 생성
export default class BossTargetState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.TARGET;
    const buttons = this.bossRoom.monsters.map((monster) => ({
      msg: monster.monsterName,
      enable: monster.monsterHp > 0,
    }));

    const battleLog = {
      msg: '공격할 대상을 선택해주세요.',
      typingAnimation: false,
      btns: buttons,
    };

    this.user.socket.write(createResponse(PacketType.S_BossBattleLog, { battleLog }));
  }

  async handleInput(responseCode) {
    const selectedMonster = this.getSelectedMonster(responseCode);

    if (!selectedMonster) {
      invalidResponseCode(this.user.socket);
      return;
    }

    this.bossRoom.selectedMonster = selectedMonster;
    this.changeState(BossPlayerAttackState);
  }

  getSelectedMonster(code) {
    const monsterIdx = code - 1;
    const monster = this.bossRoom.monsters.find(
      (m) => m.monsterIdx === monsterIdx && m.monsterHp > 0,
    );
    return monster || null;
  }
}
