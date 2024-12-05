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
const BOSS_INDEX = 0;

export default class BossPlayerAttackState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.PLAYER_ATTACK;
    this.user.completeTurn = true;

    const boss = this.bossRoom.monsters[BOSS_INDEX];
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
      await this.handleAreaSkill(userSkillInfo, disableButtons, boss);
    } else {
      // 단일 스킬 처리
      await this.handleSingleSkill(userSkillInfo, disableButtons, boss);
    }
  }

  isBuffSkill(skillInfo) {
    if (!skillInfo) {
      return false;
    }
    return skillInfo.id >= BUFF_SKILL_THRESHOLD || skillInfo.id === DEBUFF_SKILL_ID;
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

    this.user.reduceMp(skillInfo.mana);
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

    // 기본 피해 메시지
    let battleLogMessage = `${this.user.nickname}이(가) ${monster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`;

    return battleLogMessage;
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
      this.bossRoom.phase = 2; // phase를 2로 변경
      this.changeState(BossPhaseState); // 상태 변경
    } else if (boss.monsterHp <= 2000 && this.bossRoom.phase === 2) {
      this.bossRoom.phase = 3; // phase를 3으로 변경
      this.changeState(BossPhaseState); // 상태 변경
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
