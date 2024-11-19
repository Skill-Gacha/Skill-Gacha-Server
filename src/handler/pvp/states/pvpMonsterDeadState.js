import PvpState from './pvpState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import PvpGameOverWinState from './pvpGameOverWinState.js';
import PvpEnemyAttackState from './pvpEnemyAttackState.js';

// 몬스터 사망 처리
export default class PvpMonsterDeadState extends PvpState {
  async enter() {
    const monster = this.pvp.selectedMonster;

    // 몬스터 사망 애니메이션 전송
    this.socket.write(
      createResponse(PacketType.S_MonsterAction, {
        actionMonsterIdx: monster.monsterIdx,
        actionSet: {
          animCode: 4, // 사망 애니메이션 코드
        },
      }),
    );

    const aliveMonsters = this.pvp.monsters.filter((m) => m.monsterHp > 0);

    if (aliveMonsters.length === 0) {
      this.changeState(PvpGameOverWinState);
    } else {
      this.changeState(PvpEnemyAttackState);
    }
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
