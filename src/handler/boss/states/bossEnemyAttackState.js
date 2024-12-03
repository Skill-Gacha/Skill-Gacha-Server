// src/handler/boss/states/bossEnemyAttackState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossIncreaseManaState from './bossIncreaseManaState.js';
import BossPlayerDeadState from './bossPlayerDeadState.js';
import { checkStopperResist } from '../../../utils/battle/calculate.js';
import { delay } from '../../../utils/delay.js';
import BossGameOverLoseState from './bossGameOverLoseState.js';

const DEATH_ANIMATION_CODE = 1;
const ATTACK_DELAY = 1000;
const DISABLE_BUTTONS = [{ msg: '몬스터가 공격 중', enable: false }];
const BOSS_INDEX = 0;
const BOSS_SINGLE_ATTAK = 1;
const BOSS_AREA_ATTAK = 2;
const BOSS_CHANGE_STATUS_EFFECT = 3032;
const BOSS_ATTAK_EFFECT = 3033;
const BOSS_DOWN_RESIST_EFFECT = 3034;
const BOSS_BASIC_DAMAGE = 0.5;

export default class BossEnemyAttackState extends BossRoomState {
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.ENEMY_ATTACK;
    const boss = this.bossRoom.monsters[BOSS_INDEX];

    // 광역 공격만 가능 속성값도 없음
    if (this.bossRoom.phase === 1) {
      await this.bossAttackPlayers(boss);
    }

    // 광역기 & 저항력 약화 디버프 & 속성
    else if (this.bossRoom.phase === 2) {
      Math.random() < 0.5 ? await this.bossAttackPlayers(boss) : await this.downResist(boss);
    }

    // 광역기 & 저항력 약화 디버프 & 속성 & 유저 HP, MP 바꾸는 디버프
    else if (this.bossRoom.phase === 3) {
      const randomChoice = Math.floor(Math.random() * 3);

      if (randomChoice === 0) {
        await this.bossAttackPlayers(boss);
      } else if (randomChoice === 1) {
        await this.downResist(boss);
      } else {
        const aliveUsers = this.users.filter((user) => user.stat.hp > 0);
        const randomUser = aliveUsers[Math.floor(Math.random() * aliveUsers.length)];
        await this.changeStatus(boss, randomUser);
      }
    }

    // 유저의 체력이 모두 0이 됐을 때
    if (this.users.every((user) => user.stat.hp <= 0)) {
      this.changeState(BossGameOverLoseState);
      return;
    }

    // 무적 버프 초기화 및 턴 종료
    await delay(ATTACK_DELAY);
    this.users.forEach((user) => {
      user.stat.protect = false;
    });
    this.changeState(BossIncreaseManaState);
  }

  async bossAttackPlayers(bossMonster) {
    // 모든 유저에게 공격
    const aliveUsers = this.users.filter((user) => !user.isDead);
    const monsterAction = this.createMonsterAnimation(
      aliveUsers,
      bossMonster,
      BOSS_AREA_ATTAK,
      BOSS_ATTAK_EFFECT,
    );

    aliveUsers.forEach((user) => {
      let damage = bossMonster.monsterAtk * BOSS_BASIC_DAMAGE;

      if (this.bossRoom.previousElement) {
        const userResist = checkStopperResist(this.bossRoom.previousElement, user);
        damage = Math.floor(bossMonster.monsterAtk * ((100 - userResist) / 100));
      }

      if (user.stat.downResist) {
        damage = bossMonster.monsterAtk;
      }

      if (user.stat.protect) {
        damage = 1; // 보호 상태면 피해는 1로 고정
      }

      user.reduceHp(damage);
      user.stat.downResist = false; // 디버프 초기화

      user.socket.write(monsterAction);
      this.createBattleLogResponse(
        user,
        `${bossMonster.monsterName}이 당신을 공격하여 ${damage}의 피해를 입었습니다.`,
      );

      if (user.stat.hp <= 0 && aliveUsers.length !== 1) {
        this.handlePlayerDeath(user);
        return;
      }
    });
    const statusResponse = this.createStatusResponse(this.users);
    this.users.forEach((user) => {
      user.socket.write(statusResponse);
    });
  }

  async downResist(bossMonster) {
    // 모든 유저에게 디버프 적용
    const monsterAction = this.createMonsterAnimation(
      this.users,
      bossMonster,
      BOSS_AREA_ATTAK,
      BOSS_DOWN_RESIST_EFFECT,
    );
    const aliveUsers = this.users.filter((user) => !user.isDead);
    aliveUsers.forEach((user) => {
      // 디버프 상태로 전환
      user.stat.downResist = true;
      user.socket.write(monsterAction);

      this.createBattleLogResponse(
        user,
        `${bossMonster.monsterName}이 당신의 저항력을 떨어트렸습니다.`,
      );
    });
  }

  async changeStatus(bossMonster, user) {
    // HP, MP 바꾸기
    const temp = user.stat.hp;
    user.stat.hp = user.stat.mp;
    user.stat.mp = temp;
    const statusResponse = this.createStatusResponse([user]);
    const monsterAction = this.createMonsterAnimation(
      [user],
      bossMonster,
      BOSS_SINGLE_ATTAK,
      BOSS_CHANGE_STATUS_EFFECT,
    );

    this.users.forEach((u) => {
      u.socket.write(statusResponse);
      u.socket.write(monsterAction);
    });

    this.createBattleLogResponse(user, `${bossMonster.monsterName}이 당신의 HP, MP를 바꿨습니다.`);
  }

  // 각 유저의 HP, MP 데이터 만들기
  createStatusResponse(users) {
    return createResponse(PacketType.S_BossPlayerStatusNotification, {
      playerId: users.map((user) => user.id),
      hp: users.map((user) => user.stat.hp),
      mp: users.map((user) => user.stat.mp),
    });
  }

  // 유저 사망 함수
  handlePlayerDeath(user) {
    this.users.forEach((u) => {
      u.socket.write(
        createResponse(PacketType.S_BossPlayerActionNotification, {
          playerId: user.id,
          targetMonsterIdx: [],
          actionSet: {
            animCode: DEATH_ANIMATION_CODE,
          },
        }),
      );
    });
    this.changeState(BossPlayerDeadState);
  }

  // 몬스터 애니메이션 전송
  createMonsterAnimation(users, monster, animCode, effectCode) {
    return createResponse(PacketType.S_BossMonsterAction, {
      playerIds: users.map((user) => user.id),
      actionMonsterIdx: monster.monsterIdx,
      actionSet: {
        animCode,
        effectCode,
      },
    });
  }

  // 배틀로그 전송
  createBattleLogResponse(user, msg) {
    user.socket.write(
      createResponse(PacketType.S_BossBattleLog, {
        battleLog: {
          msg,
          typingAnimation: false,
          btns: DISABLE_BUTTONS,
        },
      }),
    );
  }
  async handleInput(responseCode) {}
}
