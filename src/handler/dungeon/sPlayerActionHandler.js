// src/handlers/sPlayerActionHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const sPlayerActionHandler = async (user, dungeon, responseCode) => {
  if (!user || !dungeon) {
    console.error('sPlayerActionHandler: 유저 또는 던전 객체가 없습니다.');
    return;
  }

  const monster = dungeon.monsters.find((m) => m.monsterIdx === responseCode - 1);

  if (!monster) {
    console.error(`sPlayerActionHandler: 몬스터를 찾을 수 없습니다. monsterIdx=${responseCode - 1}`);
    return;
  }

  const damage = user.stat.atk;
  monster.minusHp(damage);

  try {
    if (monster.monsterHp <= 0) {
      user.socket.write(
        createResponse(PacketType.S_MonsterAction, {
          actionMonsterIdx: monster.monsterIdx,
          actionSet: {
            animCode: 4, // 사망 애니메이션 코드
          },
        }),
      );
    } else {
      user.socket.write(
        createResponse(PacketType.S_PlayerAction, {
          targetMonsterIdx: monster.monsterIdx,
          actionSet: {
            animCode: 0,
            // TODO: 현재 effectCode가 하드 코딩으로 고정된 상태, 향후 스킬마다 이펙트 변경 필요
            effectCode: 3001,
          },
        }),
      );
    }

    user.socket.write(
      createResponse(PacketType.S_SetMonsterHp, {
        monsterIdx: monster.monsterIdx,
        hp: monster.monsterHp,
      }),
    );

    const btns = dungeon.monsters.map((m) => ({
      msg: m.monsterName,
      enable: false,
    }));

    user.socket.write(
      createResponse(PacketType.S_BattleLog, {
        battleLog: {
          msg: `${monster.monsterName}에게 ${damage}만큼의 데미지를 주었습니다.`,
          typingAnimation: false,
          btns,
        },
      }),
    );

    const aliveMonsters = dungeon.monsters.filter((m) => m.monsterHp > 0);
    if (aliveMonsters.length === 0) {
      user.socket.write(
        createResponse(PacketType.S_ScreenText, {
          screenText: {
            msg: '던전을 클리어 하셨습니다.',
            typingAnimation: true,
          },
        }),
      );
      // TODO: 버튼 추가 (예: "더 깊게 들어가기", "던전 나가기")

    }
  } catch (error) {
    console.error('sPlayerActionHandler 처리 중 오류 발생:', error);
    // 추가적인 에러 핸들링 필요 시 추가
  }
};

export default sPlayerActionHandler;
