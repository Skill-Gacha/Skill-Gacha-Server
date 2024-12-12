// src/handler/boss/states/combat/bossPlayerAttackState.js

import BossRoomState from '../base/bossRoomState.js';
import { AREASKILL, BOSS_STATUS, DEBUFF } from '../../../../constants/battle.js';
import {
  checkEnemyResist,
  skillEnhancement,
  updateDamage,
} from '../../../../utils/battle/calculate.js';
import { buffSkill } from '../../../../utils/battle/battle.js';
import { bossBuffOrDebuffSkill } from '../../bossUtils/bossBuffs.js';
import BossTurnChangeState from '../turn/bossTurnChangeState.js';
import BossPhaseState from '../phase/bossPhaseState.js';
import BossMonsterDeadState from '../result/bossMonsterDeadState.js';
import TimerManager from '#managers/timerManager.js';
import serviceLocator from '#locator/serviceLocator.js';
import {
  sendBossBattleLog,
  sendBossMonsterHpUpdate,
  sendBossPlayerActionNotification,
  sendBossBarrierCount,
  sendBossPlayerStatus,
} from '../../../../utils/battle/bossHelpers.js';

const BOSS_TURN_OVER_LIMIT = 2000;
const ACTION_ANIMATION_CODE = 0;
const BOSS_INDEX = 0;
const BOSS_PHASE_TWO_HP = 3000;
const BOSS_PHASE_THREE_HP = 1500;

export default class BossPlayerAttackState extends BossRoomState {
  constructor(...args) {
    super(...args);
    this.timerMgr = serviceLocator.get(TimerManager);
    this.timeoutId = null;
  }

  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.PLAYER_ATTACK;
    this.user.completeTurn = true;

    const boss = this.bossRoom.monsters[BOSS_INDEX];
    const selectedSkillIdx = this.bossRoom.selectedSkill;
    const userSkillInfo = this.user.userSkills[selectedSkillIdx];

    const disableButtons = this.bossRoom.monsters.map((monster) => ({
      msg: monster.monsterName,
      enable: false,
    }));

    if (this.isBuffOrDebuffSkill(userSkillInfo)) {
      await this.handleBuffOrDebuffSkill(userSkillInfo);
    } else if (this.isAreaSkill(userSkillInfo)) {
      await this.handleAreaSkill(userSkillInfo, disableButtons, boss);
    } else {
      await this.handleSingleSkill(userSkillInfo, disableButtons, boss);
    }

    this.timeoutId = this.timerMgr.requestTimer(BOSS_TURN_OVER_LIMIT, () => {
      this.changeState(BossTurnChangeState);
    });
    this.timerMgr.cancelTimer(this.timeoutId);
    this.timeoutId = null;
  }

  isBuffOrDebuffSkill(skillInfo) {
    if (!skillInfo) {
      return false;
    }
    return skillInfo.id >= DEBUFF;
  }

  isAreaSkill(skillInfo) {
    return skillInfo.id >= AREASKILL;
  }

  async handleBuffOrDebuffSkill(skillInfo) {
    this.user.reduceMp(skillInfo.mana);
    this.users.forEach((user) => {
      if (user.stat.hp > 0) {
        buffSkill(user, skillInfo.id);
        bossBuffOrDebuffSkill(user, user.socket, this.bossRoom);
      }
    });
    sendBossPlayerStatus(this.users);
    sendBossPlayerActionNotification(this.users, this.user.id, [], ACTION_ANIMATION_CODE, skillInfo.effectCode);
    this.changeState(BossTurnChangeState);
  }

  async handleAreaSkill(skillInfo, disableButtons, boss) {
    sendBossPlayerActionNotification(this.users, this.user.id, [boss.monsterIdx], ACTION_ANIMATION_CODE, skillInfo.effectCode);
    const totalDamage = this.calculateTotalDamage(skillInfo, boss);

    this.handleDamage(boss, totalDamage);
    sendBossBattleLog(this.users, this.getBattleLogMessage(boss, totalDamage), disableButtons);
    this.user.reduceMp(skillInfo.mana);
    sendBossPlayerStatus(this.users);

    this.updateBossPhase(boss);
    this.checkMonsterStates(boss);
  }

  async handleSingleSkill(skillInfo, disableButtons, boss) {
    const playerElement = this.user.element;
    const skillElement = skillInfo.element;

    let userDamage = updateDamage(
      this.user,
      skillInfo.damage * skillEnhancement(playerElement, skillElement),
    );

    sendBossPlayerActionNotification(this.users, this.user.id, [boss.monsterIdx], ACTION_ANIMATION_CODE, skillInfo.effectCode);

    const monsterResist = checkEnemyResist(skillElement, boss);
    const totalDamage = Math.floor(userDamage * ((100 - monsterResist) / 100));

    this.handleDamage(boss, totalDamage);
    sendBossBattleLog(this.users, this.getBattleLogMessage(boss, totalDamage), disableButtons);
    this.user.reduceMp(skillInfo.mana);
    sendBossPlayerStatus(this.users);

    this.updateBossPhase(boss);
    this.checkMonsterStates(boss);
  }

  handleDamage(monster, totalDamage) {
    if (this.bossRoom.shieldActivated && this.bossRoom.shieldCount > 0 && totalDamage !== 0) {
      this.bossRoom.shieldCount -= 1;
      sendBossBarrierCount(this.users, this.bossRoom.shieldCount);
    } else {
      monster.reduceHp(totalDamage);
      sendBossMonsterHpUpdate(this.users, monster);
    }
  }

  getBattleLogMessage(monster, totalDamage) {
    if (this.bossRoom.phase === 3) {
      if (this.bossRoom.shieldCount > 0) {
        return `${this.user.nickname}의 공격이 쉴드에 의해 막혔습니다.`;
      }
      this.bossRoom.shieldActivated = false;
    }
    return `${this.user.nickname}이(가) ${monster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`;
  }

  checkMonsterStates(boss) {
    if (boss.monsterHp <= 0) {
      this.changeState(BossMonsterDeadState);
    } else {
      this.changeState(BossTurnChangeState);
    }
  }

  calculateTotalDamage(skillInfo, monster) {
    const skillDamageRate = skillEnhancement(this.user.element, skillInfo.element);
    let userDamage = skillInfo.damage * skillDamageRate;
    userDamage = updateDamage(this.user, userDamage);
    const monsterResist = checkEnemyResist(skillInfo.element, monster);
    return Math.floor(userDamage * ((100 - monsterResist) / 100));
  }

  updateBossPhase(boss) {
    if (boss.monsterHp <= BOSS_PHASE_TWO_HP && this.bossRoom.phase === 1) {
      this.bossRoom.phase = 2;
      this.changeState(BossPhaseState);
    } else if (boss.monsterHp <= BOSS_PHASE_THREE_HP && this.bossRoom.phase === 2) {
      this.bossRoom.phase = 3;
      this.changeState(BossPhaseState);
    }
  }

  async handleInput(responseCode) {}
}
