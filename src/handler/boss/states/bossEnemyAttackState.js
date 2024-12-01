// src/handler/boss/states/bossEnemyAttackState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { checkEnemyResist, skillEnhancement } from '../../../utils/battle/calculate.js';
import BossRoomState from './bossRoomState.js';
import BossGameOverLoseState from './bossGameOverLoseState.js';
import BossPlayerDeadState from './bossPlayerDeadState.js';
import BossPlayerAttackState from './bossPlayerAttackState.js';

const ATTACK_DELAY = 1000;
const DEATH_ANIMATION_CODE = 1;
const SHIELD_AMOUNT = 1000;
const DISABLE_BUTTONS = [{ msg: '보스가 공격 중', enable: false }];

export default class BossEnemyAttackState extends BossRoomState {
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.ENEMY_ATTACK;
    const boss = this.bossRoom.monsters.find((monster) => monster.monsterModel === 2029); // 보스 고정
    const players = this.bossRoom.getUsers(); // 현재 플레이어 목록

    // 페이즈에 따른 저항값 조정(조우 1페이즈 제외)
    this.adjustBossResistances(boss);

    // 보스 행동 결정
    if (this.bossRoom.phase === 1) {
      await this.bossAreaAttack(players, boss); // 광역 공격 하나
    } else if (this.bossRoom.phase === 2) {
      if (!this.bossRoom.minionsSpawned) {
        // 쫄이 아직 소환되지 않았다면
        this.bossRoom.spawnMinions(); // 쫄 소환
        this.bossRoom.minionsSpawned = true; // 쫄 소환 상태를 기록
      }
      await this.attackMinions(players); // 소환된 쫄이 플레이어 공격
      return; // 플레이어 턴으로 전환
    } else if (this.bossRoom.phase === 3) {
      await this.bossThirdPhaseAction(players, boss);
    }

    await delay(ATTACK_DELAY); // 공격 후 잠시 대기
    // 무적 버프 초기화
    this.user.stat.protect = false;

    // 보스 페이즈 업데이트
    this.updateBossPhase(); // 보스 페이즈 업데이트
    this.changeState(BossPlayerAttackState); // 플레이어 턴으로 전환
  }

  //2페이즈의 소환된 쫄이 플레이어를 공격
  async attackMinions(players) {
    // monsters 배열에서 소환된 쫄 목록을 직접 사용
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

  // 보스가 플레이어에게 공격하는 메서드
  async attackPlayers(players, boss) {
    for (const player of players) {
      if (player.stat.hp > 0) {
        const damage = this.calculateBossDamage(boss, player); // 각 플레이어의 저항값을 고려하여 데미지 계산
        await this.attackPlayer(player, damage, boss); // 각 플레이어에게 공격

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

    // 모든 플레이어가 사망했는지 체크
    const allPlayersDead = players.every((player) => player.stat.hp <= 0);
    if (allPlayersDead) {
      this.changeState(BossGameOverLoseState); // 패배 상태로 전환
    }
  }

  // 1페이즈: 광역 공격
  async bossAreaAttack(players, boss) {
    for (const player of players) {
      const damage = this.calculateBossDamage(boss, player); // 각 플레이어의 저항값을 고려하여 데미지 계산
      await this.attackPlayer(player, damage, boss); // 각 플레이어에게 개별적으로 모두 공격
    }
  }

  // 2페이즈: 플레이어 공격 또는 보스의 추가 패턴
  async bossSecondPhaseAction(players, boss) {
    const actionType = Math.random() < 0.5 ? 'areaAttack' : 'applyDebuff';
    if (actionType === 'areaAttack') {
      await this.bossAreaAttack(players, boss); // 전체 공격
    } else {
      const targetPlayer = players[Math.floor(Math.random() * players.length)];
      targetPlayer.applyDebuff({ type: 'resistanceReduction' });
      this.socket.write(
        createResponse(PacketType.S_BossBattleLog, {
          battleLog: {
            msg: `${boss.monsterName}이(가) ${targetPlayer.username}에게 디버프를 적용했습니다.`,
            typingAnimation: false,
            btns: DISABLE_BUTTONS,
          },
        }),
      );
    }
  }

  // 3페이즈: 쉴드
  async bossThirdPhaseAction(players, boss) {
    const shieldAmount = SHIELD_AMOUNT; // 쉴드 1000 설정
    if (shieldAmount > 0) {
      // 쉴드가 남아있는 경우
      this.socket.write(
        createResponse(PacketType.S_BossBattleLog, {
          battleLog: {
            msg: `${boss.monsterName}의 쉴드가 ${shieldAmount} 만큼 남아있습니다.`,
            typingAnimation: false,
            btns: DISABLE_BUTTONS,
          },
        }),
      );
      return; // 쉴드가 남아있으면 행동 종료
    }

    // 쉴드가 0이 되면 HP 감소
    const damage = Math.floor(boss.hp * 0.1); // HP의 10% 감소
    if (shieldAmount > 0) {
      // 남아있는 쉴드가 있을 경우
      const damageToShield = Math.min(damage, shieldAmount); // 쉴드에 대한 데미지
      shieldAmount -= damageToShield; // 쉴드 감소
      this.socket.write(
        createResponse(PacketType.S_BossSetMonsterHp, {
          hp: boss.hp, // 쉴드로 인해 HP는 그대로
        }),
      );
    }

    // 쉴드가 0이 되면 남은 HP에서 데미지 감소
    if (shieldAmount <= 0) {
      const remainingDamage = damage - damageToShield; // 남은 데미지
      boss.hp -= remainingDamage; // HP 감소
      this.socket.write(
        createResponse(PacketType.S_BossSetMonsterHp, {
          hp: boss.hp,
        }),
      );
    }

    // 행동 결정 (50% 전체 공격, 25% 디버프, 25% HP/MP 반전)
    const actionType = Math.random();
    if (actionType < 0.5) {
      await this.bossAreaAttack(players, boss); // 전체 공격
    } else if (actionType < 0.75) {
      const targetPlayer = players[Math.floor(Math.random() * players.length)];
      targetPlayer.applyDebuff({ type: 'resistanceReduction' }); //저항력 디버프
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
      targetPlayer.applyDebuff({ type: 'swapHpMp' }); // HP와 MP 반전 디버프 적용
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

  // 보스 저항값 조정(페이즈 별로 조정, 2페이즈와 3페이즈 중복 속성 못하게 분리)
  adjustBossResistances(boss) {
    if (this.bossRoom.phase === 2) {
      const resistances = [
        'electricResist',
        'earthResist',
        'grassResist',
        'fireResist',
        'waterResist',
      ];
      const randomIndex = Math.floor(Math.random() * resistances.length);
      boss[resistances[randomIndex]] += 30; // 선택된 저항값 증가 (임시 30추가)
    } else if (this.bossRoom.phase === 3) {
      const resistances = [
        'electricResist',
        'earthResist',
        'grassResist',
        'fireResist',
        'waterResist',
      ];
      const selectedResistances = new Set();

      while (selectedResistances.size < 4) {
        const randomIndex = Math.floor(Math.random() * resistances.length);
        selectedResistances.add(resistances[randomIndex]);
      }

      const resistArray = Array.from(selectedResistances);
      const randomIndex = Math.floor(Math.random() * resistArray.length);
      boss[resistArray[randomIndex]] += 30; // 선택된 저항값 증가 (임시 30추가)
    }
  }

  // 플레이어 사망 처리 메서드
  handlePlayerDeath(player) {
    this.socket.write(
      createResponse(PacketType.S_BossPlayerActionNotification, {
        actionSet: {
          animCode: DEATH_ANIMATION_CODE, // 사망 애니메이션 코드( 사실 아직 모름 정해진게 없어서... )
        },
      }),
    );
    this.changeState(BossPlayerDeadState);
  }

  // 플레이어 공격 함수
  async attackPlayer(player, damage, attacker) {
    // 보호 상태일 경우 데미지를 1로 설정
    if (this.user.stat.protect) {
      damage = 1;
    }
    this.user.reduceHp(damage); // 플레이어의 HP 감소

    // HP 업데이트 패킷 전송
    this.socket.write(
      createResponse(PacketType.S_SetPlayerHp, {
        hp: this.user.stat.hp,
      }),
    );

    // 보스 공격 애니메이션 전송
    this.socket.write(
      createResponse(PacketType.S_BossMonsterAction, {
        playerIds: [player.id], // 공격을 받을 플레이어 ID
        actionMonsterIdx: attacker.monsterIdx,
        actionSet: {
          animCode: 0, // 공격 애니메이션 코드(사실 아직 몇번인지 모름)
          effectCode: attacker.effectCode,
        },
      }),
    );

    // 공격 결과 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_BossBattleLog, {
        battleLog: {
          msg: `${attacker.monsterName}이(가) ${player.username}에게 ${damage}의 피해를 입혔습니다.`,
          typingAnimation: false,
          btns: DISABLE_BUTTONS,
        },
      }),
    );
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

  // 보스 페이즈 업데이트
  updateBossPhase() {
    const phase = this.bossRoom.phase; // 현재 페이즈

    // 보스 페이즈 업데이트 패킷 전송
    this.socket.write(
      createResponse(PacketType.S_BossPhase, {
        randomElement: this.element, // this.element를 사용하여 보스의 속성 코드 확인
        phase: phase,
        monsterIdx: this.bossRoom.monsters.map((monster) => ({ monsterIdx: monster.monsterIdx })),
      }),
    );
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
