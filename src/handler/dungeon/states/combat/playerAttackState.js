// src/handler/dungeon/states/combat/playerAttackState.js

import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';
import DungeonState from '../base/dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import MonsterDeadState from './monsterDeadState.js';
import { AREASKILL, BUFF_SKILL, DEBUFF, DUNGEON_STATUS, DUNGEON_TURN_OVER_LIMIT } from '../../../../constants/battle.js';
import { checkEnemyResist, skillEnhancement, updateDamage } from '../../../../utils/battle/calculate.js';
import { buffSkill } from '../../../../utils/battle/battle.js';
import { useBuffSkill } from '../../dungeonUtils/dungeonBuffs.js';
import {
  sendBattleLog,
  sendMonsterHpUpdate,
  sendPlayerAction,
} from '../../../../utils/battle/dungeonHelpers.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { PacketType } from '../../../../constants/header.js';

const ACTION_ANIMATION_CODE = 0;
const BUFF_SKILL_THRESHOLD = BUFF_SKILL;
const DEBUFF_SKILL_ID = DEBUFF;

export default class PlayerAttackState extends DungeonState {
  constructor(...args) {
    super(...args);
    this.timerMgr = serviceLocator.get(TimerManager);
    this.timeoutId = null;
  }

  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.PLAYER_ATTACK;

    const selectedSkillIdx = this.dungeon.selectedSkill;
    const userSkillInfo = this.user.userSkills[selectedSkillIdx];

    const disableButtons = this.dungeon.monsters.map((monster) => ({
      msg: monster.monsterName,
      enable: false,
    }));

    if (this.isBuffSkill(userSkillInfo)) {
      await this.handleBuffSkill(userSkillInfo);
      return;
    }

    if (this.isAreaSkill(userSkillInfo)) {
      await this.handleAreaSkill(userSkillInfo, disableButtons);
      return;
    }

    await this.handleSingleSkill(userSkillInfo, disableButtons);
  }

  isBuffSkill(skillInfo) {
    return skillInfo.id >= BUFF_SKILL_THRESHOLD;
  }

  isAreaSkill(skillInfo) {
    return skillInfo.id >= AREASKILL;
  }

  async handleBuffSkill(skillInfo) {
    buffSkill(this.user, skillInfo.id);
    useBuffSkill(this.user, this.socket, this.dungeon);

    this.user.reduceMp(skillInfo.mana);
    this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));

    sendPlayerAction(this.socket, [], ACTION_ANIMATION_CODE, skillInfo.effectCode);

    this.timeoutId = this.timerMgr.requestTimer(DUNGEON_TURN_OVER_LIMIT, () => {
      this.changeState(EnemyAttackState);
    });
  }

  async handleAreaSkill(skillInfo, disableButtons) {
    const aliveMonsters = this.getAliveMonsters();

    if (skillInfo.id === DEBUFF_SKILL_ID) {
      buffSkill(this.user, skillInfo.id);
      useBuffSkill(this.user, this.socket, this.dungeon);
    }

    sendPlayerAction(
      this.socket,
      aliveMonsters.map((m) => m.monsterIdx),
      ACTION_ANIMATION_CODE,
      skillInfo.effectCode
    );

    for (const monster of aliveMonsters) {
      const totalDamage = this.calculateTotalDamage(skillInfo, monster);
      monster.reduceHp(totalDamage);
      sendMonsterHpUpdate(this.socket, monster);
    }

    sendBattleLog(this.socket, '광역 스킬을 사용하여 모든 몬스터에게 피해를 입혔습니다.', disableButtons);

    this.user.reduceMp(skillInfo.mana);
    this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));

    this.timeoutId = this.timerMgr.requestTimer(DUNGEON_TURN_OVER_LIMIT, () => {
      if (skillInfo.id !== DEBUFF_SKILL_ID) {
        this.user.stat.buff = null;
      }

      const allMonstersDead = this.checkAllMonstersDead();
      if (allMonstersDead) {
        this.changeState(MonsterDeadState);
      } else {
        this.changeState(EnemyAttackState);
      }
    });
  }

  async handleSingleSkill(skillInfo, disableButtons) {
    const targetMonster = this.dungeon.selectedMonster;
    const totalDamage = this.getSingleTargetDamage(skillInfo, targetMonster);

    targetMonster.reduceHp(totalDamage);
    this.user.reduceMp(skillInfo.mana);
    this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));

    sendMonsterHpUpdate(this.socket, targetMonster);
    sendPlayerAction(this.socket, [targetMonster.monsterIdx], ACTION_ANIMATION_CODE, skillInfo.effectCode);

    sendBattleLog(this.socket, `${targetMonster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`, disableButtons);

    this.timeoutId = this.timerMgr.requestTimer(DUNGEON_TURN_OVER_LIMIT, () => {
      this.user.stat.buff = null;
      if (targetMonster.monsterHp <= 0) {
        this.changeState(MonsterDeadState);
      } else {
        this.changeState(EnemyAttackState);
      }
    });
  }

  getAliveMonsters() {
    return this.dungeon.monsters.filter((m) => m.monsterHp > 0);
  }

  checkAllMonstersDead() {
    return this.dungeon.monsters.every((monster) => monster.monsterHp <= 0);
  }

  calculateTotalDamage(skillInfo, monster) {
    const skillDamageRate = skillEnhancement(this.user.element, skillInfo.element);
    let userDamage = skillInfo.damage * skillDamageRate;
    userDamage = updateDamage(this.user, userDamage);
    const monsterResist = checkEnemyResist(skillInfo.element, monster);
    return Math.floor(userDamage * ((100 - monsterResist) / 100));
  }

  getSingleTargetDamage(skillInfo, monster) {
    const skillDamageRate = skillEnhancement(this.user.element, skillInfo.element);
    let userDamage = skillInfo.damage * skillDamageRate;
    userDamage = updateDamage(this.user, userDamage);
    const monsterResist = checkEnemyResist(skillInfo.element, monster);
    return Math.floor(userDamage * ((100 - monsterResist) / 100));
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
