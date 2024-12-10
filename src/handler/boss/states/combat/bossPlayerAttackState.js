// src/handler/boss/states/combat/bossPlayerAttackState.js

import BossRoomState from '../base/bossRoomState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import { delay } from '../../../../utils/delay.js';
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

const ACTION_ANIMATION_CODE = 0;
const PLAYER_ACTION_DELAY = 1000;
const BOSS_INDEX = 0;

export default class BossPlayerAttackState extends BossRoomState {
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
    this.sendPlayerStatus(this.user);
    this.sendPlayerAction([], skillInfo.effectCode);

    await delay(PLAYER_ACTION_DELAY);

    this.changeState(BossTurnChangeState);
  }

  async handleAreaSkill(skillInfo, disableButtons, boss) {
    this.sendPlayerAction([boss.monsterIdx], skillInfo.effectCode);
    const totalDamage = this.calculateTotalDamage(skillInfo, boss);

    this.handleDamage(boss, totalDamage);
    this.sendBattleLog(this.getBattleLogMessage(boss, totalDamage), disableButtons);
    this.user.reduceMp(skillInfo.mana);
    this.sendPlayerStatus(this.user);

    await delay(PLAYER_ACTION_DELAY);

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

    this.sendPlayerAction([boss.monsterIdx], skillInfo.effectCode);

    const monsterResist = checkEnemyResist(skillElement, boss);
    const totalDamage = Math.floor(userDamage * ((100 - monsterResist) / 100));

    this.handleDamage(boss, totalDamage);
    this.sendBattleLog(this.getBattleLogMessage(boss, totalDamage), disableButtons);
    this.user.reduceMp(skillInfo.mana);
    this.sendPlayerStatus(this.user);

    await delay(PLAYER_ACTION_DELAY);

    this.updateBossPhase(boss);
    this.checkMonsterStates(boss);
  }

  handleDamage(monster, totalDamage) {
    if (this.bossRoom.shieldActivated && this.bossRoom.shieldCount > 0 && totalDamage !== 0) {
      this.bossRoom.shieldCount -= 1;
      this.sendBarrierCount(this.bossRoom.shieldCount);
    } else {
      monster.reduceHp(totalDamage);
      this.sendMonsterHpUpdate(monster);
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
    this.users.forEach((user) => {
      user.socket.write(
        createResponse(PacketType.S_BossPlayerActionNotification, {
          playerId: this.user.id,
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

  updateBossPhase(boss) {
    if (boss.monsterHp <= 4000 && this.bossRoom.phase === 1) {
      this.bossRoom.phase = 2;
      this.changeState(BossPhaseState);
    } else if (boss.monsterHp <= 2000 && this.bossRoom.phase === 2) {
      this.bossRoom.phase = 3;
      this.changeState(BossPhaseState);
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

  async handleInput(responseCode) {}
}
