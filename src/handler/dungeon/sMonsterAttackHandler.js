import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const sMonsterAttackHandler = (user, monster) => {
  user.stat.hp -= monster.atk;

  user.socket.write(
    createResponse(PacketType.S_SetPlayerHp, {
      hp: user.stat.hp,
      // 감소한 체력 전송
    }),
  );

  user.socket.write(
    createResponse(PacketType.S_MonsterAction, {
      actionMonsterIdx: monster.monsterIdx,
      actionSet: {
        animCode: Math.floor(Math.random() * 2),
        // 0 혹은 1 공격 모션 실행
        effectCode: monster.effectCode,
      },
    }),
  );

  user.socket.write(
    createResponse(PacketType.S_BattleLog, {
      battleLog: {
        msg: `${monster.monsterName}에게 ${monster.atk} 만큼 공격을 받았습니다.`,
        typingAnimation: true,
      },
    }),
  );
};
