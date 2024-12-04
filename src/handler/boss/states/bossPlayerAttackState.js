// src/handler/boss/states/bossPlayerAttackState.js

import BossRoomState from './bossRoomState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { AREASKILL, BUFF_SKILL, DEBUFF, BOSS_STATUS } from '../../../constants/battle.js';
import {
  checkEnemyResist,
  skillEnhancement,
  updateDamage,
} from '../../../utils/battle/calculate.js';
import { buffSkill, bossBuffSkill } from '../../../utils/battle/battle.js';
import BossMonsterDeadState from './bossMonsterDeadState.js';
import BossTurnChangeState from './bossTurnChangeState.js';
import BossPhaseState from './bossPhaseState.js';

const ACTION_ANIMATION_CODE = 0;
const BUFF_SKILL_THRESHOLD = BUFF_SKILL;
const DEBUFF_SKILL_ID = DEBUFF;
const PLAYER_ACTION_DELAY = 1000;
const BOSS_MONSTER_MODEL = 2029;

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
    } else if (this.isAreaSkill(userSkillInfo)) {
      await this.handleAreaSkill(userSkillInfo, disableButtons);
    } else {
      // 단일 스킬 처리
      await this.handleSingleSkill(userSkillInfo, disableButtons);
    }
  }

  isBuffSkill(skillInfo) {
    return skillInfo.id >= BUFF_SKILL_THRESHOLD;
  }

  isAreaSkill(skillInfo) {
    return skillInfo.id >= AREASKILL;
  }

  async handleBuffSkill(skillInfo) {
    // 모든 파티원에게 버프 적용
    this.users.forEach((user) => {
      if (user.stat.hp > 0) {
        // 살아있는 플레이어에게만 버프 적용
        buffSkill(user, skillInfo.id);
        bossBuffSkill(user, user.socket, this.bossRoom);
      }
    });

    buffSkill(this.user, skillInfo.id);
    bossBuffSkill(this.user, this.user.socket, this.bossRoom);
    this.user.reduceMp(skillInfo.mana);
    this.sendPlayerStatus(this.user);
    this.sendPlayerAction([], skillInfo.effectCode);

    await delay(PLAYER_ACTION_DELAY);
    this.changeState(BossTurnChangeState);
  }

  async handleAreaSkill(skillInfo, disableButtons) {
    const aliveMonsters = this.getAliveMonsters();

    if (skillInfo.id === DEBUFF_SKILL_ID) {
      buffSkill(this.user, skillInfo.id);
      bossBuffSkill(this.user, this.user.socket, this.bossRoom);
    }

    const targetMonsterIdxs = aliveMonsters.map((m) => m.monsterIdx);
    this.sendPlayerAction(targetMonsterIdxs, skillInfo.effectCode);

    for (const monster of aliveMonsters) {
      const totalDamage = this.calculateTotalDamage(skillInfo, monster);
      this.handleDamage(monster, totalDamage);
    }

    this.sendBattleLog(this.getBattleLogMessage(), disableButtons);
    this.user.reduceMp(skillInfo.mana);
    this.sendPlayerStatus(this.user);

    await delay(PLAYER_ACTION_DELAY);
    this.updateBossPhase();

    this.checkMonsterStates();
  }

  async handleSingleSkill(skillInfo, disableButtons) {
    const playerElement = this.user.element;
    const skillElement = skillInfo.element;
    let userDamage = updateDamage(
      this.user,
      skillInfo.damage * skillEnhancement(playerElement, skillElement),
    );

    const aliveMonsters = this.getAliveMonsters();
    const targetMonsterIdxs = aliveMonsters.map((m) => m.monsterIdx);
    this.sendPlayerAction(targetMonsterIdxs, skillInfo.effectCode);

    for (const monster of aliveMonsters) {
      const monsterResist = checkEnemyResist(skillElement, monster);
      const totalDamage = Math.floor(userDamage * ((100 - monsterResist) / 100));
      this.handleDamage(monster, totalDamage);
      this.sendBattleLog(this.getDamageLogMessage(monster, totalDamage), disableButtons);
    }

    this.user.reduceMp(skillInfo.mana);
    this.sendPlayerStatus(this.user);

    await delay(PLAYER_ACTION_DELAY);
    this.updateBossPhase();
    this.checkMonsterStates();
  }

  handleDamage(monster, totalDamage) {
    if (this.bossRoom.shieldActivated && this.bossRoom.shieldCount > 0) {
      this.bossRoom.shieldCount -= 1;
      this.sendBarrierCount(this.bossRoom.shieldCount);
    } else {
      monster.reduceHp(totalDamage);
      this.sendMonsterHpUpdate(monster);
    }
  }

  getBattleLogMessage() {
    if (this.bossRoom.shieldCount === 5) {
      return `${this.user.nickname}이(가) 광역 스킬을 사용하여 모든 몬스터에게 피해를 입혔습니다.`;
    } else {
      return `모든 몬스터의 공격이 쉴드에 의해 막혔습니다.`;
    }
  }

  getDamageLogMessage(monster, totalDamage) {
    if (this.bossRoom.shieldCount === 5) {
      return `효과는 굉장했다! \n${monster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`;
    } else {
      return `${monster.monsterName}의 공격이 쉴드에 의해 막혔습니다.`;
    }
  }

  checkMonsterStates() {
    if (this.checkAllMonstersDead()) {
      this.changeState(BossMonsterDeadState);
    } else {
      this.changeState(BossTurnChangeState);
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
    this.users.forEach((user) => {
      user.socket.write(
        createResponse(PacketType.S_BossSetMonsterHp, {
          monsterIdx: monster.monsterIdx,
          hp: monster.monsterHp,
        }),
      );
    });
  }

  sendBarrierCount(barrierCount) {
    this.users.forEach((user) => {
      user.socket.write(
        createResponse(PacketType.S_BossBarrierCount, {
          barrierCount,
        }),
      );
    });
  }

  sendPlayerAction(targetMonsterIdxs, effectCode) {
    const playerIds = this.users.map((user) => user.id);
    this.users.forEach((user) => {
      user.socket.write(
        createResponse(PacketType.S_BossPlayerActionNotification, {
          playerId: playerIds,
          targetMonsterIdx: targetMonsterIdxs,
          actionSet: {
            animCode: ACTION_ANIMATION_CODE,
            effectCode: effectCode,
          },
        }),
      );
    });
  }

  sendBattleLog(message, buttons) {
    this.users.forEach((user) => {
      user.socket.write(
        createResponse(PacketType.S_BossBattleLog, {
          battleLog: {
            msg: message,
            typingAnimation: false,
            btns: buttons,
          },
        }),
      );
    });
  }
  checkAllMonstersDead() {
    return this.bossRoom.monsters.every((monster) => monster.monsterHp <= 0);
  }

  updateBossPhase() {
    const boss = this.bossRoom.monsters.find(
      (monster) => monster.monsterModel === BOSS_MONSTER_MODEL,
    );
    if (boss) {
      if (boss.monsterHp <= 4000 && this.bossRoom.phase === 1) {
        this.bossRoom.phase = 2; // phase를 2로 변경
        this.changeState(BossPhaseState); // 상태 변경
      } else if (boss.monsterHp <= 2000 && this.bossRoom.phase === 2) {
        this.bossRoom.phase = 3; // phase를 3으로 변경
        this.changeState(BossPhaseState); // 상태 변경
      }
    }
  }

  sendPlayerStatus() {
    const playerIds = this.users.map((u) => u.id);
    const hps = this.users.map((u) => u.stat.hp);
    const mps = this.users.map((u) => u.stat.mp);
    this.users.forEach((u) => {
      u.socket.write(
        createResponse(PacketType.S_BossPlayerStatusNotification, {
          playerId: playerIds,
          hp: hps,
          mp: mps,
        }),
      );
    });
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
