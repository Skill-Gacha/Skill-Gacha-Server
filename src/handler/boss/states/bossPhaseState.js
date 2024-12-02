// src/handler/boss/states/bossPhaseState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import { invalidResponseCode } from '../../../utils/error/invalidResponseCode.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import BossRoomState from './bossRoomState.js';
import BossPlayerAttackState from './bossPlayerAttackState.js';
import {
  checkEnemyResist,
  RESISTANCE_KEYS,
  skillEnhancement,
} from '../../../utils/battle/calculate.js'; // RESISTANCE_KEYS 가져오기

const SHIELD_AMOUNT = 1000;
const DISABLE_BUTTONS = [{ msg: '보스가 공격 중', enable: false }];

export default class BossPhaseState extends BossRoomState {
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.BOSS_PHASE_CHANGE;

    // 현재 보스의 페이즈에 따라 행동 결정
    const phase = this.bossRoom.phase;
    const boss = this.bossRoom.monsters.find((monster) => monster.monsterModel === 2029); // 보스 고정

    // 보스의 저항값 조정
    this.setBossResistances(boss, phase);

    // 보스의 상태 정보를 클라이언트에 전송
    const randomElement = this.bossRoom.element; // 현재 보스의 속성
    this.socket.write(
      createResponse(PacketType.S_BossPhase, {
        randomElement: randomElement, // 보스 속성
        phase: phase, // 보스 페이즈
        monsterIdx: this.bossRoom.monsters.map((monster) => ({
          monsterIdx: monster.monsterIdx,
          hp: monster.monsterHp, // 각 몬스터의 HP 추가
        })),
      }),
    );

    // 페이즈에 따라 보스 행동 결정
    if (phase === 1) {
      await this.bossAreaAttack(this.bossRoom.getUsers(), boss); // 1페이즈: 광역 공격
    } else if (phase === 2) {
      if (!this.bossRoom.minionsSpawned) {
        this.bossRoom.spawnMinions(); // 쫄 소환
        this.bossRoom.minionsSpawned = true; // 쫄 소환 상태를 기록
      }
      await this.attackMinions(this.bossRoom.getUsers()); // 2페이즈: 소환된 쫄이 플레이어 공격
    } else if (phase === 3) {
      await this.bossThirdPhaseAction(this.bossRoom.getUsers(), boss); // 3페이즈: 추가 행동
    }

    // 플레이어 턴으로 전환
    this.changeState(BossPlayerAttackState);
  }

  // 보스 저항값 조정(페이즈 별로 조정)
  setBossResistances(boss, phase) {
    const resistanceKeys = Object.keys(RESISTANCE_KEYS);
    let selectedResistanceKey;

    if (phase === 2) {
      const randomIndex = Math.floor(Math.random() * resistanceKeys.length);
      selectedResistanceKey = resistanceKeys[randomIndex];
      this.bossRoom.setBossElement(randomIndex + 1); // 1~5 사이의 랜덤 값으로 설정
      boss.resistance = selectedResistanceKey;
    } else if (phase === 3) {
      const previousResistance = this.bossRoom.previousResistance;
      const filteredResistanceKeys = resistanceKeys.filter((key) => key !== previousResistance);
      const randomIndex = Math.floor(Math.random() * filteredResistanceKeys.length);
      selectedResistanceKey = filteredResistanceKeys[randomIndex];
      this.bossRoom.setBossElement(randomIndex + 1); // 1~5 사이의 랜덤 값으로 설정
      boss.resistance = selectedResistanceKey;
    }

    if (selectedResistanceKey) {
      this.bossRoom.previousResistance = selectedResistanceKey; // 현재 저항 키 저장
    }
  }

  // 1페이즈: 광역 공격
  async bossAreaAttack(players, boss) {
    for (const player of players) {
      const damage = this.calculateBossDamage(boss, player); // 각 플레이어의 저항값을 고려하여 데미지 계산
      await this.attackPlayer(player, damage, boss); // 각 플레이어에게 개별적으로 공격

      // 플레이어 HP 업데이트
      this.socket.write(
        createResponse(PacketType.S_SetPlayerHp, {
          hp: player.stat.hp,
        }),
      );
    }
  }

  // 2페이즈: 소환된 쫄이 플레이어를 공격
  async attackMinions(players) {
    const minions = this.bossRoom.monsters; // 이미 spawnMinions에서 추가된 쫄 몬스터들

    for (const minion of minions) {
      for (const player of players) {
        if (player.stat.hp > 0) {
          const damage = this.calculateBossDamage(minion, player); // 쫄의 데미지 계산
          await this.attackPlayer(player, damage, minion); // 쫄이 플레이어에게 공격

          // 플레이어 HP 업데이트
          this.socket.write(
            createResponse(PacketType.S_SetPlayerHp, {
              hp: player.stat.hp,
            }),
          );

          // 플레이어가 사망했는지 체크
          if (player.stat.hp <= 0) {
            this.handlePlayerDeath(player);
            return; // 사망 처리 후 종료
          }
        }
      }
    }
  }

  // 3페이즈: 추가 행동
  async bossThirdPhaseAction(players, boss) {
    // 쉴드가 남아있는 경우
    if (this.bossRoom.shieldAmount > 0) {
      this.socket.write(
        createResponse(PacketType.S_BossBattleLog, {
          battleLog: {
            msg: `${boss.monsterName}의 쉴드가 ${this.bossRoom.shieldAmount} 만큼 남아있습니다.`,
            typingAnimation: false,
            btns: DISABLE_BUTTONS,
          },
        }),
      );
      return; // 쉴드가 남아있으면 종료
    }

    // 쉴드가 0이 되면 HP 감소
    const damage = Math.floor(boss.hp * 0.1); // HP의 10% 감소
    let damageToShield = Math.min(damage, this.bossRoom.shieldAmount); // 쉴드에 대한 데미지
    this.bossRoom.shieldAmount -= damageToShield; // 쉴드 감소

    // 쉴드가 0이 된 경우 남은 대미지
    let remainingDamage = damage - damageToShield; // 남은 대미지
    if (this.bossRoom.shieldAmount <= 0) {
      remainingDamage += Math.abs(this.bossRoom.shieldAmount); // 쉴드 소진된 만큼 추가
      this.bossRoom.shieldAmount = 0; // 쉴드 0으로 설정
    }

    // 보스 HP 감소
    boss.hp -= remainingDamage;

    // 클라이언트에 보스 HP 업데이트 전송
    this.socket.write(
      createResponse(PacketType.S_BossSetMonsterHp, {
        hp: boss.hp,
      }),
    );

    // 행동 결정 (50% 전체 공격, 25% 디버프, 25% HP/MP 반전)
    const actionType = Math.random();
    if (actionType < 0.5) {
      await this.bossAreaAttack(players, boss); // 전체 공격
    } else if (actionType < 0.75) {
      const targetPlayer = players[Math.floor(Math.random() * players.length)];
      targetPlayer.stat.applyDebuff({ type: 'resistanceReduction' }); // 저항력 디버프 적용
      this.socket.write(
        createResponse(PacketType.S_BossBattleLog, {
          battleLog: {
            msg: `${boss.monsterName}이(가) ${targetPlayer.username}에게 디버프를 적용했습니다.`,
            typingAnimation: false,
            btns: DISABLE_BUTTONS,
          },
        }),
      );
    } else {
      const targetPlayer = players[Math.floor(Math.random() * players.length)];
      targetPlayer.stat.applyDebuff({ type: 'swapHpMp' }); // HP와 MP 반전 디버프 적용
      this.socket.write(
        createResponse(PacketType.S_BossBattleLog, {
          battleLog: {
            msg: `${boss.monsterName}이(가) ${targetPlayer.username}에게 HP와 MP 반전 디버프를 적용했습니다.`,
            typingAnimation: false,
            btns: DISABLE_BUTTONS,
          },
        }),
      );
    }
  }

  // 데미지 계산 함수
  calculateBossDamage(attacker, player) {
    let baseDamage = attacker.damage; // 보스의 기본 공격력
    const skillElement = attacker.element; // 보스의 공격 속성
    const playerElement = player.element; // 플레이어의 속성

    // 속성 배율 적용
    const skillDamageRate = skillEnhancement(playerElement, skillElement);
    const resist = checkEnemyResist(skillElement, player); // 플레이어의 저항력 체크
    const totalDamage = Math.floor(baseDamage * skillDamageRate * ((100 - resist) / 100)); // 최종 데미지 계산

    return totalDamage; // 최종 데미지 반환
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
    invalidResponseCode(responseCode);
  }
}
