import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import switchToGameOverLoseState from '../transition/switchToGameOverLoseState.js';
import { delay } from '../delay.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import switchToActionState from '../transition/switchToActionState.js';

export default async function handleEnemyAttackState(responseCode, dungeon, user, socket) {
  console.log('handleEnemyAttackState Called');
  dungeon.dungeonStatus = DUNGEON_STATUS.ENEMY_ATTACK;

  // 버튼 비활성화 처리 (필요한 최소한의 버튼만 활성화)
  let battleLog = {
    msg: '적의 공격 차례입니다.',
    typingAnimation: false,
    btns: [
      { msg: '계속하기', enable: true },
    ],
  };

  socket.write(
    createResponse(PacketType.S_BattleLog, { battleLog }),
  );

  // '계속하기' 버튼 입력 대기
  if (responseCode !== 0) {
    const aliveMonsters = dungeon.monsters.filter((m) => m.monsterHp > 0);

    for (const monster of aliveMonsters) {
      const damage = monster.monsterAtk;
      user.updateUserHp(damage);

      // 플레이어 HP 업데이트 패킷 전송
      socket.write(
        createResponse(PacketType.S_SetPlayerHp, {
          hp: user.stat.hp,
        }),
      );

      // 몬스터 공격 애니메이션 패킷 전송
      socket.write(
        createResponse(PacketType.S_MonsterAction, {
          actionMonsterIdx: monster.monsterIdx,
          actionSet: {
            animCode: 0, // 공격 애니메이션 코드
            effectCode: monster.effectCode,
          },
        }),
      );

      // 공격 결과 메시지 전송
      socket.write(
        createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: `${monster.monsterName}이(가) 당신을 공격하여 ${damage}의 피해를 입었습니다.`,
            typingAnimation: false,
            btns: [
              { msg: '계속하기', enable: true },
            ],
          },
        }),
      );

      // 플레이어 사망 체크
      if (user.stat.hp <= 0) {
        await switchToGameOverLoseState(0, dungeon, user, socket);
        return;
      }

      await delay(1000);
    }

    // 몬스터 공격 후 행동 선택 상태로 전환
    await switchToActionState(dungeon, socket);
  }
}
