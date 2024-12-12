// src/handler/boss/states/combat/bossEnemyAttackState.js

import { BOSS_STATUS } from '../../../../constants/battle.js';
import BossRoomState from '../base/bossRoomState.js';
import BossIncreaseManaState from '../turn/bossIncreaseManaState.js';
import BossPlayerDeadState from './bossPlayerDeadState.js';
import { checkStopperResist } from '../../../../utils/battle/calculate.js';
import serviceLocator from '#locator/serviceLocator.js';
import TimerManager from '#managers/timerManager.js';
import { invalidResponseCode } from '../../../../utils/error/invalidResponseCode.js';
import {
  sendBossBattleLog,
  sendBossMonsterAction,
  sendBossPlayerActionNotification,
  sendBossPlayerStatusOfUsers,
} from '../../../../utils/battle/bossHelpers.js';

const DEATH_ANIMATION_CODE = 1;
const ATTACK_DELAY = 5000;
const BOSS_INDEX = 0;
const BOSS_SINGLE_ATTACK = 1;
const BOSS_AREA_ATTACK = 0;
const BOSS_CHANGE_STATUS_EFFECT = 3032;
const BOSS_ATTACK_EFFECT = 3033;
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

    sendBossMonsterAction(this.users, bossMonster.monsterIdx, BOSS_AREA_ATTACK, BOSS_ATTACK_EFFECT);

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

      sendBossBattleLog(
        user,
        `${bossMonster.monsterName}이 당신을 공격하여 ${damage}의 피해를 입었습니다.`,
        this.user === user ? BUTTON_CONFIRM_ENABLE : BUTTON_CONFIRM_DISABLE
      );

      if (user.stat.hp <= 0) {
        this.handlePlayerDeath(user);
      }
    });

    sendBossPlayerStatusOfUsers(this.users, this.users);
  }

  async downResist(bossMonster) {
    const aliveUsers = this.users.filter((user) => !user.isDead);

    sendBossMonsterAction(this.users, bossMonster.monsterIdx, BOSS_AREA_ATTACK, BOSS_DOWN_RESIST_EFFECT);

    aliveUsers.forEach((user) => {
      user.stat.downResist = true;
      sendBossBattleLog(user, `${bossMonster.monsterName}이 당신의 저항력을 떨어트렸습니다.`);
    });
  }

  async changeStatus(bossMonster, user) {
    user.changeHpMp();
    sendBossPlayerStatusOfUsers(this.users, [user]);

    sendBossMonsterAction([user], bossMonster.monsterIdx, BOSS_SINGLE_ATTACK, BOSS_CHANGE_STATUS_EFFECT, [user.id]);

    sendBossBattleLog(user, `${bossMonster.monsterName}이 당신의 HP, MP를 바꿨습니다.`);
  }

  handlePlayerDeath(user) {
    sendBossPlayerActionNotification(
      this.users,
      user.id,
      [],
      DEATH_ANIMATION_CODE,
      null
    );
    this.changeState(BossPlayerDeadState);
  }

  async handleInput(responseCode) {
    if (responseCode === 1) {
      if (this.timeoutId) {
        this.timerMgr.cancelTimer(this.timeoutId);
        this.timeoutId = null;
      }
      if (this.bossRoom.bossRoomStatus === BOSS_STATUS.ENEMY_ATTACK)
        this.changeState(BossIncreaseManaState);
    } else {
      invalidResponseCode(this.user.socket);
    }
  }
}
