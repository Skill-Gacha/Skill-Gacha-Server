// src/handler/boss/states/bossPlayerAttackState.js

import BossRoomState from './bossRoomState.js';
import BossEnemyAttackState from './bossEnemyAttackStateTest.js';
import MonsterDeadState from './bossMonsterDeadState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { AREASKILL, BUFF_SKILL, DEBUFF, BOSS_STATUS } from '../../../constants/battle.js';
import {
  checkEnemyResist,
  skillEnhancement,
  updateDamage,
} from '../../../utils/battle/calculate.js';
import { buffSkill, useBuffSkill } from '../../../utils/battle/battle.js';

const ACTION_ANIMATION_CODE = 0;
const BUFF_SKILL_THRESHOLD = BUFF_SKILL;
const DEBUFF_SKILL_ID = DEBUFF;
const PLAYER_ACTION_DELAY = 1000;

export default class BossPlayerAttackState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.PLAYER_ATTACK;

    const selectedSkillIdx = this.bossRoom.selectedSkill;
    const userSkillInfo = this.user.userSkills[selectedSkillIdx];

    // 공격 시 의도되지 않은 조작 방지 위한 버튼 비활성화
    const disableButtons = this.bossRoom.monsters.map((monster) => ({
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

    // 단일 스킬 처리
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
    useBuffSkill(this.user, this.socket, this.bossRoom);

    this.user.reduceMp(skillInfo.mana);
    this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));

    this.sendPlayerAction([], skillInfo.effectCode);
    await delay(PLAYER_ACTION_DELAY);
    this.changeState(BossEnemyAttackState);
  }

  async handleAreaSkill(skillInfo, disableButtons) {
    const aliveMonsters = this.getAliveMonsters();

    if (skillInfo.id === DEBUFF_SKILL_ID) {
      buffSkill(this.user, skillInfo.id);
      useBuffSkill(this.user, this.socket, this.bossRoom);
    }

    this.sendPlayerAction(
      aliveMonsters.map((m) => m.monsterIdx),
      skillInfo.effectCode,
    );

    for (const monster of aliveMonsters) {
      const totalDamage = this.calculateTotalDamage(skillInfo, monster);
      monster.reduceHp(totalDamage);
      this.sendMonsterHpUpdate(monster);
    }

    this.sendBattleLog('광역 스킬을 사용하여 모든 몬스터에게 피해를 입혔습니다.', disableButtons);

    this.user.reduceMp(skillInfo.mana);
    this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));
    await delay(PLAYER_ACTION_DELAY);

    const allMonstersDead = this.checkAllMonstersDead();
    if (allMonstersDead) {
      this.changeState(MonsterDeadState);
    } else {
      this.changeState(BossEnemyAttackState);
    }
  }

  async handleSingleSkill(skillInfo, disableButtons) {
    const targetMonster = this.bossRoom.selectedMonster;

    const playerElement = this.user.element;
    const skillElement = skillInfo.element;
    const skillDamageRate = skillEnhancement(playerElement, skillElement);
    let userDamage = skillInfo.damage * skillDamageRate;

    userDamage = updateDamage(this.user, userDamage);
    const monsterResist = checkEnemyResist(skillElement, targetMonster);
    const totalDamage = Math.floor(userDamage * ((100 - monsterResist) / 100));

    targetMonster.reduceHp(totalDamage);
    this.user.reduceMp(skillInfo.mana);
    this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));

    this.sendMonsterHpUpdate(targetMonster);
    this.sendPlayerAction([targetMonster.monsterIdx], skillInfo.effectCode);

    const battleLogMsg =
      skillDamageRate > 1
        ? `효과는 굉장했다! \n${targetMonster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`
        : `${targetMonster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`;

    this.sendBattleLog(battleLogMsg, disableButtons);
    await delay(PLAYER_ACTION_DELAY);

    if (targetMonster.monsterHp <= 0) {
      this.changeState(MonsterDeadState);
    } else {
      this.changeState(BossEnemyAttackState);
    }
  }

  getAliveMonsters() {
    return this.bossRoom.monsters.filter((monster) => monster.monsterHp > 0);
  }

  calculateTotalDamage(skillInfo, monster) {
    const skillDamageRate = skillEnhancement(this.user.element, skillInfo.element);
    let userDamage = skillInfo.damage * skillDamageRate;
    userDamage = updateDamage(this.user, userDamage);
    const monsterResist = checkEnemyResist(skillInfo.element, monster);
    return Math.floor(userDamage * ((100 - monsterResist) / 100));
  }

  sendMonsterHpUpdate(monster) {
    this.socket.write(
      createResponse(PacketType.S_SetMonsterHp, {
        monsterIdx: monster.monsterIdx,
        hp: monster.monsterHp,
      }),
    );
  }

  sendPlayerAction(targetMonsterIdxs, effectCode) {
    this.socket.write(
      createResponse(PacketType.S_PlayerAction, {
        targetMonsterIdx: targetMonsterIdxs,
        actionSet: {
          animCode: ACTION_ANIMATION_CODE,
          effectCode: effectCode,
        },
      }),
    );
  }

  sendBattleLog(message, buttons) {
    this.socket.write(
      createResponse(PacketType.S_BossBattleLog, {
        battleLog: {
          msg: message,
          typingAnimation: false,
          btns: buttons,
        },
      }),
    );
  }

  checkAllMonstersDead() {
    return this.bossRoom.monsters.every((monster) => monster.monsterHp <= 0);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
