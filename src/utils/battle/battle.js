// src/utils/battle/battle.js

import { PacketType } from '../../constants/header.js';
import { delay } from '../delay.js';

// 자신
export const MyStatus = (my) => {
  return {
    playerClass: my.element,
    playerLevel: my.stat.level,
    playerName: my.nickname,
    playerFullHp: my.stat.maxHp,
    playerFullMp: my.stat.maxMp,
    playerCurHp: my.stat.hp,
    playerCurMp: my.stat.mp,
  };
};

// 상대
export const OpponentStatus = (opponent) => {
  return {
    playerClass: opponent.element,
    playerLevel: opponent.stat.level,
    playerName: opponent.nickname,
    playerFullHp: opponent.stat.maxHp,
    playerCurHp: opponent.stat.hp,
  };
};

export const buffSkill = (user, skillId) => {
  const buffs = {
    26: '전투의 함성',
    27: '치유의 손길',
    28: '구원의 손길',
    29: '영혼 분쇄',
  };

  if (buffs[skillId]) {
    user.stat.buff = buffs[skillId];
  } else {
    console.error(`알 수 없는 ID: ${skillId}`);
  }
};

export const useBuffSkill = async (user, socket) => {
  switch (user.stat.buff) {
    case '전투의 함성':
      socket.write(
        createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: '전투의 함성! 공격력이 두 배로 증가했습니다!',
            typingAnimation: false,
          },
        }),
      );
      await delay(1000);
      break;

    case '치유의 손길':
      const existHp = this.user.stat.hp;
      this.user.increaseHpMp(this.user.stat.maxHp * 0.3, 0); // 최대 체력의 30% 회복
      this.socket.write(createResponse(PacketType.S_SetPlayerHp, { hp: this.user.stat.hp }));
      this.socket.write(
        createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: `치유의 손길! 체력이 ${this.user.stat.hp - existHp}만큼 회복되었습니다!`,
            typingAnimation: false,
          },
        }),
      );
      await delay(1000);
      break;

    case '구원의 손길':
      const existMp = this.user.stat.mp;
      this.user.increaseHpMp(0, this.user.stat.maxMp * 0.3); // 최대 마나의 30% 회복
      this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));
      this.socket.write(
        createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: `구원의 손길! 마나가 ${this.user.stat.mp - existMp}만큼 회복되었습니다!`,
            typingAnimation: false,
          },
        }),
      );
      await delay(1000);
      break;

    case '영혼 분쇄':
      // 상태 이상 제거 로직 필요
      this.socket.write(
        createResponse(PacketType.S_BattleLog, {
          battleLog: { msg: '영혼 분쇄! 모든 상태 이상이 제거되었습니다!', typingAnimation: false },
        }),
      );
      await delay(1000);
      break;

    default:
      console.warn(`유저에게 버프가 존재하지 않습니다.: ${user.stat.buff}`);
      break;
  }
};
