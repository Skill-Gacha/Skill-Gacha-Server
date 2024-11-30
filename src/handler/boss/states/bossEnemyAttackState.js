// src/handler/boss/states/bossEnemyAttackState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { checkEnemyResist, skillEnhancement } from '../../../utils/battle/calculate.js';

const ATTACK_DELAY = 1000;
const DISABLE_BUTTONS = [{ msg: '보스가 공격 중', enable: false }];

export default class BossEnemyAttackState extends BossRoomState {
  async enter() {
    this.bossRoom.bossRoomStatus = BOSS_STATUS.ENEMY_ATTACK;
    const boss = this.bossRoom.monsters.find((monster) => monster.monsterModel === 2029); // 보스 찾기
    const players = this.bossRoom.getUsers(); // 현재 플레이어 목록

    // 보스의 공격 패턴 결정
    for (const player of players) {
      const bossDamage = this.calculateDamage(boss, player); // 각 플레이어에 대한 데미지 계산

      if (this.bossRoom.phase === 1) {
        // 1페이즈: 보스 광역기 사용
        await this.attackPlayer(player, bossDamage, boss);
      } else if (this.bossRoom.phase === 2) {
        // 2페이즈: 저항력 약화 디버프 추가 및 공격
        await this.attackPlayer(player, bossDamage, boss);
        this.applyDebuff(players, 'resistanceReduction'); // 저항력 약화 디버프
      } else if (this.bossRoom.phase === 3) {
        // 3페이즈: HP, MP 교체 디버프 추가 및 공격
        await this.attackPlayer(player, bossDamage, boss);
        this.applyDebuff(players, 'swapHpMp'); // HP, MP 교체 디버프
      }

      // 플레이어가 사망했는지 체크
      if (player.stat.hp <= 0) {
        this.socket.write(
          createResponse(PacketType.S_PlayerAction, {
            actionSet: {
              animCode: 1, // 사망 애니메이션 코드
            },
          }),
        );
        this.changeState(PlayerDeadState);
        return;
      }

      await delay(ATTACK_DELAY); // 공격 간 딜레이
    }

    // 쫄 몬스터 공격
    this.bossRoom.monsters.forEach((monster) => {
      if (monster.monsterModel !== 2029) {
        const minionDamage = this.calculateDamage(monster); // 쫄 몬스터의 데미지 계산
        players.forEach(async (player) => {
          await this.attackPlayer(player, minionDamage, monster); // 각 플레이어에게 쫄 몬스터가 공격
        });
      }
    });

    await delay(1000); // 공격 후 잠시 대기
    this.updateBossPhase(); // 보스 페이즈 업데이트
    this.changeState(BossPlayerAttackState); // 플레이어 턴으로 전환
  }

  // 플레이어 공격 메서드
  async attackPlayer(player, damage, attacker) {
    // 플레이어 HP 감소
    player.reduceHp(damage);

    // HP 업데이트 패킷 전송
    this.socket.write(
      createResponse(PacketType.S_SetPlayerHp, {
        hp: player.stat.hp,
      }),
    );

    // 보스 공격 애니메이션 전송
    this.socket.write(
      createResponse(PacketType.S_BossMonsterAction, {
        playerIds: [player.id], // 공격을 받을 플레이어 ID
        actionMonsterIdx: attacker.monsterIdx,
        actionSet: {
          animCode: 0, // 공격 애니메이션 코드
          effectCode: attacker.effectCode,
        },
      }),
    );

    // 공격 결과 메시지 전송
    this.socket.write(
      createResponse(PacketType.S_BattleLog, {
        battleLog: {
          msg: `${attacker.monsterName}이(가) ${player.username}에게 ${damage}의 피해를 입혔습니다.`,
          typingAnimation: false,
          btns: DISABLE_BUTTONS,
        },
      }),
    );
  }

  // 데미지 계산 메서드
  calculateDamage(attacker, player) {
    let baseDamage = attacker.damage; // 보스의 기본 공격력
    const skillElement = attacker.element; // 보스의 공격 속성
    const playerElement = player.element; // 플레이어의 속성

    // 속성 배율 적용
    const skillDamageRate = skillEnhancement(playerElement, skillElement);
    const resist = checkEnemyResist(skillElement, player); // 플레이어의 저항력 체크
    const totalDamage = Math.floor(baseDamage * skillDamageRate * ((100 - resist) / 100)); // 최종 데미지 계산

    return totalDamage; // 최종 데미지 반환
  }

  // 디버프 적용 메서드
  applyDebuff(players, debuffType) {
    players.forEach((player) => {
      player.applyDebuff({ type: debuffType });
    });
  }

  // 보스 페이즈 업데이트 메서드
  updateBossPhase() {
    const randomElement = Math.floor(Math.random() * 5) + 1; // 랜덤 속성 코드 생성 (1~5)
    const phase = this.bossRoom.phase; // 현재 페이즈

    // 보스 페이즈 업데이트 패킷 전송
    this.socket.write(
      createResponse(PacketType.S_BossPhase, {
        randomElement: randomElement,
        phase: phase,
        monsterIdx: this.bossRoom.monsters.map((monster) => ({ monsterIdx: monster.monsterIdx })),
      }),
    );
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
