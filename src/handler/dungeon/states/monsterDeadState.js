import DungeonState from './dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import rewardState from './rewardState.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

// 몬스터 사망 처리
export default class MonsterDeadState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.MONSTER_DEAD;

    // 광역 스킬이나 단일 스킬에 따라 사망 처리
    const deadMonsters = this.dungeon.monsters.filter((m) => m.monsterHp <= 0 && !m.isDead);

    if (deadMonsters.length === 0) {
      console.error('No monsters to process in MonsterDeadState!');
      return;
    }

    // 모든 사망 몬스터에 대해 애니메이션 전송
    deadMonsters.forEach((monster) => {
      this.socket.write(
        createResponse(PacketType.S_MonsterAction, {
          actionMonsterIdx: monster.monsterIdx,
          actionSet: {
            animCode: 4, // 사망 애니메이션 코드
          },
        }),
      );

      // 사망 애니메이션 처리가 끝난 몬스터는 더 이상 사망 상태로 처리
      monster.isDead = true;
    });

    // 생존 몬스터 확인
    const aliveMonsters = this.dungeon.monsters.filter((m) => m.monsterHp > 0);

    if (aliveMonsters.length === 0) {
      // 모든 몬스터가 사망한 경우 보상 상태로 전환
      this.changeState(rewardState);
    } else {
      // 아직 살아있는 몬스터가 있으면 적 공격 상태로 전환
      this.changeState(EnemyAttackState);
    }
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
