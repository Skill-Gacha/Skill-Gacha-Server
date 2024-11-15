import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const sMonsterActionHandler = async (user, dungeon) => {
  const monsters = dungeon.monsters;

  const btns = []; // 배틀이 종료되고 생성되는 버튼들

  // 던전 세션 안에 몬스터 배열에서 인덱스를 돌아가면서 설정
  for (const monster of monsters) {
    if (monster.monsterHp <= 0) {
      btns.push({ msg: monster.monsterName, enable: false });
      continue;
    }

    const actionSet = {
      animCode: Math.floor(Math.random() * 2), // 0이랑 1이 몬스터 공격 모션
      effectCode: monster.effectCode,
    };

    user.updateUserHp(monster.atk);

    const actionBattleLog = {
      battleLog: {
        msg: `몬스터에게 공격받아 ${monster.atk}만큼 체력이 감소하였습니다.`,
        typingAnimation: true,
        btns: [dungeon.monster],
      },
    };

    try {
      await user.socket.write(
        createResponse(PacketType.S_MonsterAction, {
          actionMonsterIdx: monster.monsterIdx,
          actionSet,
        }),
      );
      await user.socket.write(createResponse(PacketType.S_SetPlayerHp, { hp: user.stat.hp }));
      await user.socket.write(createResponse(PacketType.S_BattleLog, actionBattleLog));
      btns.push({ msg: monster.monsterName, enable: true });
    } catch (error) {
      console.error('S_MonsterAction 패킷 전송 중 오류 발생:', error);
      return;
    }
  }

  // 몬스터의 공격이 모두 끝난 후 배틀로그
  //   const endBattleLog = {
  //     battleLog: {
  //       msg: '몬스터를 선택하여 공격을 진행해주세요',
  //       typingAnimation: true,
  //       btns,
  //     },
  //   };
  //   user.socket.write(createResponse(PacketType.S_BattleLog, endBattleLog));
};
