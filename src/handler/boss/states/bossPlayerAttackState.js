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

    // 모든 몬스터에 대한 타겟 인덱스 생성
    const targetMonsterIdxs = aliveMonsters.map((m) => m.monsterIdx);

    this.sendPlayerAction(targetMonsterIdxs, skillInfo.effectCode); // 플레이어 액션 전송

    for (const monster of aliveMonsters) {
      const totalDamage = this.calculateTotalDamage(skillInfo, monster);

      // 쉴드가 있는지 확인
      if (this.bossRoom.shieldActivated && this.bossRoom.shieldCount > 0) {
        // 쉴드가 남아있는 경우
        this.bossRoom.shieldCount -= 1; // 쉴드의 남은 공격 횟수 감소
        this.sendBarrierCount(this.bossRoom.shieldCount);
        console.log(`쉴드가 공격을 막았습니다. 남은 공격 횟수: ${this.bossRoom.shieldCount}`);
        // 몬스터에게 피해를 주지 않음
      } else {
        // 쉴드가 남아있지 않으면 몬스터에게 피해를 줌
        monster.reduceHp(totalDamage);
        this.sendMonsterHpUpdate(monster); // 몬스터 체력 업데이트
      }
    }

    console.log(`현재 쉴드 상태:`, this.bossRoom.shieldActivated);

    // 쉴드가 남아있지 않아서 피해를 주었을 때의 로그 메시지
    const battleLogMsg =
      this.bossRoom.shieldCount === 5
        ? '광역 스킬을 사용하여 모든 몬스터에게 피해를 입혔습니다.'
        : '모든 몬스터의 공격이 쉴드에 의해 막혔습니다.';

    this.sendBattleLog(battleLogMsg, disableButtons);

    this.user.reduceMp(skillInfo.mana);
    this.sendPlayerStatus(this.user);

    await delay(PLAYER_ACTION_DELAY);

    // 보스 체력 감소 및 phase 체크
    this.updateBossPhase(); // 보스 phase 체크

    const allMonstersDead = this.checkAllMonstersDead();
    if (allMonstersDead) {
      this.changeState(BossMonsterDeadState);
    } else {
      this.changeState(BossTurnChangeState);
    }
  }

  async handleSingleSkill(skillInfo, disableButtons) {
    const playerElement = this.user.element;
    const skillElement = skillInfo.element;
    const skillDamageRate = skillEnhancement(playerElement, skillElement);
    let userDamage = skillInfo.damage * skillDamageRate;

    userDamage = updateDamage(this.user, userDamage);

    // 모든 살아있는 몬스터 가져오기
    const aliveMonsters = this.getAliveMonsters();

    // 모든 몬스터에 대한 타겟 인덱스 생성
    const targetMonsterIdxs = aliveMonsters.map((m) => m.monsterIdx);

    this.sendPlayerAction(targetMonsterIdxs, skillInfo.effectCode); // 플레이어 액션 전송

    for (const monster of aliveMonsters) {
      const monsterResist = checkEnemyResist(skillElement, monster);
      const totalDamage = Math.floor(userDamage * ((100 - monsterResist) / 100));

      // 쉴드가 있는지 확인
      if (this.bossRoom.shieldActivated && this.bossRoom.shieldCount > 0) {
        // 쉴드가 남아있는 경우
        this.bossRoom.shieldCount -= 1; // 쉴드의 남은 공격 횟수 감소
        this.sendBarrierCount(this.bossRoom.shieldCount);
        console.log(`쉴드가 공격을 막았습니다. 남은 공격 횟수: ${this.bossRoom.shieldCount}`);
        // 몬스터에게 피해를 주지 않음
      } else {
        // 쉴드가 남아있지 않으면 몬스터에게 피해를 줌
        monster.reduceHp(totalDamage);
        this.sendMonsterHpUpdate(monster); // 몬스터 체력 업데이트
      }

      // 피해를 입혔을 때의 로그 메시지
      const battleLogMsg =
        this.bossRoom.shieldCount === 5
          ? skillDamageRate > 1
            ? `효과는 굉장했다! \n${monster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`
            : `${monster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`
          : `${monster.monsterName}의 공격이 쉴드에 의해 막혔습니다.`;

      this.sendBattleLog(battleLogMsg, disableButtons);
    }

    this.user.reduceMp(skillInfo.mana);
    this.sendPlayerStatus(this.user);

    await delay(PLAYER_ACTION_DELAY);

    // 보스 체력 감소 및 phase 체크
    this.updateBossPhase(); // 보스 phase 체크

    // 보스 체력 확인 및 상태 변경
    if (this.checkAllMonstersDead()) {
      this.changeState(BossMonsterDeadState);
    } else if (aliveMonsters[0].hp <= 0) {
      // 보스 체력이 0 이하인지 체크
      this.changeState(BossMonsterDeadState); // 보스가 죽었을 때 상태 변경
    } else {
      this.changeState(BossTurnChangeState); // 보스가 살아있고 공격 상태로 변경
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
    this.user.socket.write(
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

  updateBossPhase() {
    const boss = this.bossRoom.monsters.find(
      (monster) => monster.monsterModel === BOSS_MONSTER_MODEL,
    );
    if (boss) {
      // 현재 phase가 1일 때
      if (boss.monsterHp <= 4000 && this.bossRoom.phase === 1) {
        this.bossRoom.phase = 2; // phase를 2로 변경
        this.changeState(BossPhaseState); // 상태 변경
        console.log(`보스의 phase가 ${this.bossRoom.phase}phase로 변경되었습니다.`);
      }
      // 현재 phase가 2일 때
      else if (boss.monsterHp <= 2000 && this.bossRoom.phase === 2) {
        this.bossRoom.phase = 3; // phase를 3으로 변경
        this.changeState(BossPhaseState); // 상태 변경
        console.log(`보스의 phase가 ${this.bossRoom.phase}phase로 변경되었습니다.`);
      }
    }
  }

  // 각 유저의 HP, MP 알림 전송
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
