// src/handler/boss/states/phase/bossPhaseState.js

import { BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import { getElementById } from '../../../../init/loadAssets.js';
import { elementResist } from '../../../../utils/packet/playerPacket.js';
import logger from '../../../../utils/log/logger.js';
import { sendBossBattleLog, sendBossPhase } from '../../../../utils/battle/bossHelpers.js';

const DISABLE_BUTTONS = [{ msg: '보스가 공격 중', enable: false }];
const BOSS_MONSTER_MODEL = 2029;
const MIN_ELEMENT_CODE_OFFSET = 1001;
const MAX_ELEMENT_CODE_OFFSET = 1006;

export default class BossPhaseState extends BossRoomState {
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.BOSS_PHASE_CHANGE;

    const boss = this.bossRoom.monsters.find(
      (monster) => monster.monsterModel === BOSS_MONSTER_MODEL,
    );

    let phase = this.bossRoom.phase;
    let randomElement = this.bossRandomElement();
    this.bossRoom.previousElement = randomElement;

    this.setBossResistances(boss, randomElement, phase);
    sendBossPhase(this.users, randomElement, phase);

    if (phase === 3 && !this.bossRoom.shieldActivated) {
      this.createShield(boss);
      this.bossRoom.shieldActivated = true;
    }
  }

  bossRandomElement() {
    return Math.floor(
      Math.random() * (MAX_ELEMENT_CODE_OFFSET - MIN_ELEMENT_CODE_OFFSET) + MIN_ELEMENT_CODE_OFFSET,
    );
  }

  setBossResistances(boss, randomElement, phase) {
    const chosenElement = getElementById(randomElement);
    if (!chosenElement) {
      logger.error('bossPhaseState: 존재하지 않는 속성 ID입니다.');
      return;
    }

    if (phase === 2) {
      boss.resistances = elementResist(chosenElement);
      this.bossRoom.previousElement = randomElement;
    } else if (phase === 3) {
      const previousElement = this.bossRoom.previousElement;
      if (previousElement === randomElement) {
        randomElement = this.bossRandomElement();
      }
      boss.resistances = elementResist(chosenElement);
    }
  }

  createShield(boss) {
    const message = `${boss.monsterName}가 쉴드를 생성했습니다. 쉴드가 ${this.bossRoom.shieldCount}회 공격을 막습니다.`;
    sendBossBattleLog(this.users, message, DISABLE_BUTTONS);
  }

  async handleInput(responseCode) {}
}
