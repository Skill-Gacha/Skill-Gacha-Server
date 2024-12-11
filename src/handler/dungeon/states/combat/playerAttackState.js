// src/handler/dungeon/states/playerAttackState.js

import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js'; // 중앙 타이머 서비스 임포트

import DungeonState from '../base/dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import MonsterDeadState from './monsterDeadState.js';

import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { AREASKILL, BUFF_SKILL, DEBUFF, DUNGEON_STATUS, DUNGEON_TURN_OVER_LIMIT } from '../../../../constants/battle.js';
import { checkEnemyResist, skillEnhancement, updateDamage } from '../../../../utils/battle/calculate.js';
import { buffSkill } from '../../../../utils/battle/battle.js';
import { useBuffSkill } from '../../dungeonUtils/dungeonBuffs.js';

const ACTION_ANIMATION_CODE = 0;
const BUFF_SKILL_THRESHOLD = BUFF_SKILL;
const DEBUFF_SKILL_ID = DEBUFF;

export default class PlayerAttackState extends DungeonState {
  constructor(...args) {
    super(...args);
    this.timerMgr = serviceLocator.get(TimerManager); // 타이머 매니저 인스턴스 가져오기
    this.timeoutId = null; // 타이머 식별자 초기화
  }

  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.PLAYER_ATTACK;

    const selectedSkillIdx = this.dungeon.selectedSkill;
    const userSkillInfo = this.user.userSkills[selectedSkillIdx];

    // 공격 시 의도되지 않은 조작 방지 위한 버튼 비활성화
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
    useBuffSkill(this.user, this.socket, this.dungeon);

    this.user.reduceMp(skillInfo.mana);
    this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));

    this.sendPlayerAction([], skillInfo.effectCode);

    // 타이머 매니저를 통해 타이머 설정
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

    // 타이머 매니저를 통해 타이머 설정
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

    // 타이머 매니저를 통해 타이머 설정
    this.timeoutId = this.timerMgr.requestTimer(DUNGEON_TURN_OVER_LIMIT, () => {
      this.user.stat.buff = null;

      if (targetMonster.monsterHp <= 0) {
        targetMonster.isDead = true;
        this.changeState(MonsterDeadState);
      } else {
        this.changeState(EnemyAttackState);
      }
    });
  }

  getAliveMonsters() {
    return this.dungeon.monsters.filter((monster) => monster.monsterHp > 0);
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
      createResponse(PacketType.S_BattleLog, {
        battleLog: {
          msg: message,
          typingAnimation: false,
          btns: buttons,
        },
      }),
    );
  }

  checkAllMonstersDead() {
    return this.dungeon.monsters.every((monster) => monster.monsterHp <= 0);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
