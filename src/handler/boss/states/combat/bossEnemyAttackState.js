// src/handler/boss/states/combat/bossEnemyAttackState.js

import { BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import { PacketType } from '../../../../constants/header.js';
import { createResponse } from '../../../../utils/response/createResponse.js';
import BossIncreaseManaState from '../turn/bossIncreaseManaState.js';
import BossPlayerDeadState from './bossPlayerDeadState.js';
import { checkStopperResist } from '../../../../utils/battle/calculate.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';

const DEATH_ANIMATION_CODE = 1;
const ATTACK_DELAY = 5000;
const BOSS_INDEX = 0;
const BOSS_SINGLE_ATTAK = 1;
const BOSS_AREA_ATTAK = 0;
const BOSS_CHANGE_STATUS_EFFECT = 3032;
const BOSS_ATTAK_EFFECT = 3033;
const BOSS_DOWN_RESIST_EFFECT = 3034;
const BOSS_BASIC_DAMAGE = 0.5;
const BUTTON_CONFIRM_ENABLE = [{ msg: '확인', enable: true }];
const BUTTON_CONFIRM_DISABLE = [{ msg: '확인', enable: false }];

export default class BossEnemyAttackState extends BossRoomState {
  constructor(...args) {
    super(...args);
    this.timeoutId = null;
    this.timerMgr = serviceLocator.get(TimerManager);
  }
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.ENEMY_ATTACK;
    const boss = this.bossRoom.monsters[BOSS_INDEX];

    if (this.bossRoom.phase === 1) {
      await this.bossAttackPlayers(boss);
    } else if (this.bossRoom.phase === 2) {
      Math.random() < 0.8 ? await this.bossAttackPlayers(boss) : await this.downResist(boss);
    } else if (this.bossRoom.phase === 3) {
      const randomChoice = Math.random();
      if (randomChoice < 0.7) {
        await this.bossAttackPlayers(boss);
      } else if (randomChoice < 0.85) {
        await this.downResist(boss);
      } else {
        const aliveUsers = this.users.filter((user) => user.stat.hp > 0);
        const randomUser = aliveUsers[Math.floor(Math.random() * aliveUsers.length)];
        await this.changeStatus(boss, randomUser);
      }
    }

    this.users.forEach((user) => {
      user.stat.protect = false;
    });

    const updateAliveUsers = this.users.filter((user) => user.stat.hp > 0);
    this.timeoutId = this.timerMgr.requestTimer(ATTACK_DELAY, () => {
      if (updateAliveUsers.length !== 0) this.handleInput(1);
    });
  }

  async bossAttackPlayers(bossMonster) {
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
        damage = 1;
      }

      user.reduceHp(damage);
      user.stat.downResist = false;

      this.sendBattleLogResponse(
        user,
        `${bossMonster.monsterName}이 당신을 공격하여 ${damage}의 피해를 입었습니다.`,
      );

      if (user.stat.hp <= 0) {
        this.handlePlayerDeath(user);
      }
    });
    const statusResponse = this.createStatusResponse(this.users);

    this.users.forEach((user) => {
      user.socket.write(statusResponse);
      user.socket.write(monsterAction);
    });
  }

  async downResist(bossMonster) {
    const aliveUsers = this.users.filter((user) => !user.isDead);
    const monsterAction = this.createMonsterAnimation(
      aliveUsers,
      bossMonster,
      BOSS_AREA_ATTAK,
      BOSS_DOWN_RESIST_EFFECT,
    );

    aliveUsers.forEach((user) => {
      user.stat.downResist = true;
      this.sendBattleLogResponse(
        user,
        `${bossMonster.monsterName}이 당신의 저항력을 떨어트렸습니다.`,
      );
    });

    this.users.forEach((user) => {
      user.socket.write(monsterAction);
    });
  }

  async changeStatus(bossMonster, user) {
    user.changeHpMp();
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

    this.sendBattleLogResponse(user, `${bossMonster.monsterName}이 당신의 HP, MP를 바꿨습니다.`);
  }

  createStatusResponse(users) {
    return createResponse(PacketType.S_BossPlayerStatusNotification, {
      playerId: users.map((user) => user.id),
      hp: users.map((user) => user.stat.hp),
      mp: users.map((user) => user.stat.mp),
    });
  }

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

  sendBattleLogResponse(user, msg) {
    user.socket.write(
      createResponse(PacketType.S_BossBattleLog, {
        battleLog: {
          msg,
          typingAnimation: false,
          btns: this.user === user ? BUTTON_CONFIRM_ENABLE : BUTTON_CONFIRM_DISABLE,
        },
      }),
    );
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      if (this.timeoutId) {
        this.timerMgr.cancelTimer(this.timeoutId); // 타이머 취소
        this.timeoutId = null;
      }
      this.changeState(BossIncreaseManaState);
    } else {
      invalidResponseCode(this.user.socket);
    }
  }
}
