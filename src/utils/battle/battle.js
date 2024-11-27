// src/utils/battle/battle.js

import { buffs } from '../../constants/battle.js';
import { PacketType } from '../../constants/header.js';
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
  if (buffs[skillId]) {
    user.stat.buff = buffs[skillId];
  } else {
    console.error(`알 수 없는 ID: ${skillId}`);
  }
};

export const useBuffSkill = (user, socket, dungeon) => {
  const disableButtons = dungeon.monsters.map((monster) => ({
    msg: monster.monsterName,
    enable: false,
  }));

  switch (user.stat.buff) {
    case 1:
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
      break;

    case 2:
      const existHp = user.stat.hp;
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
      break;

    case 3:
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
      break;

    case 4:
      user.stat.protect = true;
      try {
        socket.write(
          createResponse(PacketType.S_BattleLog, {
            battleLog: {
              msg: '영혼 분쇄! 상대방의 공격력이 쇄약해졌습니다!',
              typingAnimation: false,
              btns: disableButtons,
            },
          }),
        );
      } catch (error) {
        console.error('소켓 쓰기 중 오류 발생:', error);
      }
      break;

    default:
      console.warn(`유저에게 버프가 존재하지 않습니다.: ${user.stat.buff}`);
      break;
  }
};

export const pvpUseBuffSkill = (user, stopper) => {
  const disableButtons = [{ msg: stopper.nickname, enable: false }];

  switch (user.stat.buff) {
    case 1:
      try {
        user.socket.write(
          createResponse(PacketType.S_PvpBattleLog, {
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
      break;

    case 2:
      const existHp = user.stat.hp;
      user.increaseHpMp(user.stat.maxHp * 0.3, 0); // 최대 체력의 30% 회복

      try {
        user.socket.write(createResponse(PacketType.S_SetPvpPlayerHp, { hp: user.stat.hp }));
        stopper.socket.write(createResponse(PacketType.S_SetPvpEnemyHp, { hp: user.stat.hp }));
        user.socket.write(
          createResponse(PacketType.S_PvpBattleLog, {
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
      break;

    case 3:
      const existMp = user.stat.mp;
      user.increaseHpMp(0, user.stat.maxMp * 0.3); // 최대 마나의 30% 회복

      try {
        user.socket.write(createResponse(PacketType.S_SetPvpPlayerMp, { mp: user.stat.mp }));
        user.socket.write(
          createResponse(PacketType.S_PvpBattleLog, {
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
      break;

    case 4:
      user.stat.protect = true;
      console.log('제발', user.stat.protect);
      try {
        user.socket.write(
          createResponse(PacketType.S_PvpBattleLog, {
            battleLog: {
              msg: '영혼 분쇄! 상대방의 공격력이 쇄약해졌습니다!',
              typingAnimation: false,
              btns: disableButtons,
            },
          }),
        );
      } catch (error) {
        console.error('소켓 쓰기 중 오류 발생:', error);
      }
      break;

    default:
      console.warn(`유저에게 버프가 존재하지 않습니다.: ${user.stat.buff}`);
      break;
  }
};
