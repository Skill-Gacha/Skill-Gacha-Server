// src/utils/battle/battle.js

import { PacketType } from '../../constants/header.js';
import { delay } from '../delay.js';
import { createResponse } from '../response/createResponse.js';

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

export const useBuffSkill = async (user, socket, dungeon) => {
  const disableButtons = dungeon.monsters.map((monster) => ({
    msg: monster.monsterName,
    enable: false,
  }));

  switch (user.stat.buff) {
    case '전투의 함성':
      try {
        socket.write(
          createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: '전투의 함성! 공격력이 두 배로 증가했습니다!',
              typingAnimation: false,
              btns: disableButtons,
            },
          }),
        );
      } catch (error) {
        console.error('소켓 쓰기 중 오류 발생:', error);
      }
      await delay(1000);
      break;

    case '치유의 손길':
      const existHp = user.stat.hp;
      console.log(user.stat.maxHp * 0.3);
      user.increaseHpMp(user.stat.maxHp * 0.3, 0); // 최대 체력의 30% 회복

      try {
        socket.write(createResponse(PacketType.S_SetPlayerHp, { hp: user.stat.hp }));
        socket.write(
          createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: `치유의 손길! 체력이 ${user.stat.hp - existHp}만큼 회복되었습니다!`,
              typingAnimation: false,
              btns: disableButtons,
            },
          }),
        );
      } catch (error) {
        console.error('소켓 쓰기 중 오류 발생:', error);
      }
      await delay(1000);
      break;

    case '구원의 손길':
      console.log(user.stat.maxMp * 0.3);
      const existMp = user.stat.mp;
      user.increaseHpMp(0, user.stat.maxMp * 0.3); // 최대 마나의 30% 회복

      try {
        socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: user.stat.mp }));
        socket.write(
          createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: `구원의 손길! 마나가 ${user.stat.mp - existMp}만큼 회복되었습니다!`,
              typingAnimation: false,
              btns: disableButtons,
            },
          }),
        );
      } catch (error) {
        console.error('소켓 쓰기 중 오류 발생:', error);
      }

      await delay(1000);
      break;

    case '영혼 분쇄':
      user.stat.protect = true;
      try {
        console.log('너 실행 안 돼?');
        socket.write(
          createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: '영혼 분쇄! 모든 상태 이상이 제거되었습니다!',
              typingAnimation: false,
              btns: disableButtons,
            },
          }),
        );
      } catch (error) {
        console.error('소켓 쓰기 중 오류 발생:', error);
      }
      await delay(1000);
      break;

    default:
      console.warn(`유저에게 버프가 존재하지 않습니다.: ${user.stat.buff}`);
      break;
  }
};
