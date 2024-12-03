// src/handler/boss/states/bossEnemyAttackState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossIncreaseManaState from './bossIncreaseManaState.js';
import BossPlayerDeadState from './bossPlayerDeadState.js';
import { checkStopperResist } from '../../../utils/battle/calculate.js';
import { delay } from '../../../utils/delay.js';

const ATTACK_ANIMATION_CODE = 0;
const DEATH_ANIMATION_CODE = 1;
const ATTACK_DELAY = 1000;
const DISABLE_BUTTONS = [{ msg: '몬스터가 공격 중', enable: false }];

export default class BossEnemyAttackState extends BossRoomState {
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.ENEMY_ATTACK;
    const boss = this.bossRoom.monsters[0];

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

    // 무적 버프 초기화 및 턴 종료
    await delay(ATTACK_DELAY);
    this.users.forEach((user) => {
      user.stat.protect = false;
    });
    this.changeState(BossIncreaseManaState);
  }

  async bossAttackPlayers(bossMonster) {
    // 모든 유저에게 공격
    const monsterAction = this.createMonsterAnimation(this.users, bossMonster, 3001);
    this.users.forEach((user) => {
      let damage = bossMonster.monsterAtk;

      if (this.element) {
        const userResist = checkStopperResist(this.element, user);
        damage = Math.floor(damage * ((100 - userResist) / 100));
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

      if (user.stat.hp <= 0) {
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
    const monsterAction = this.createMonsterAnimation(this.users, bossMonster, 3001);
    this.users.forEach((user) => {
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
    const monsterAction = this.createMonsterAnimation([user], bossMonster, 3001);

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
  createMonsterAnimation(users, monster, effectCode) {
    return createResponse(PacketType.S_BossMonsterAction, {
      playerIds: users.map((user) => user.id),
      actionMonsterIdx: monster.monsterIdx,
      actionSet: {
        animCode: ATTACK_ANIMATION_CODE,
        effectCode, // 공격 유형에 따라 이펙트 코드 정해야 됨
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
