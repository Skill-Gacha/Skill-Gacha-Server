// src/handler/dungeon/dungeonUtils/dungeonBuffs.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import logger from '../../../utils/log/logger.js';

// 던전에서 버프 스킬 사용 처리 함수
export const useBuffSkill = (user, socket, dungeon) => {
  const disableButtons = dungeon.monsters.map((monster) => ({
    msg: monster.monsterName,
    enable: false,
  }));

  const sendBattleLog = (msg) => {
    try {
      socket.write(
        createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg,
            typingAnimation: false,
            btns: disableButtons,
          },
        }),
      );
    } catch (error) {
      logger.error('소켓 쓰기 중 오류 발생:', error);
    }
  };

  switch (user.stat.buff) {
    case 1:
      user.stat.battleCry = true;
      sendBattleLog('전투의 함성! 공격력이 두 배로 증가했습니다!');
      break;

    case 2: {
      const existHp = user.stat.hp;
      user.increaseHpMp(user.stat.maxHp * 0.3, 0);
      try {
        socket.write(createResponse(PacketType.S_SetPlayerHp, { hp: user.stat.hp }));
      } catch (error) {
        logger.error('HP 설정 중 오류 발생:', error);
      }
      sendBattleLog(`치유의 손길! 체력이 ${user.stat.hp - existHp}만큼 회복되었습니다!`);
      break;
    }

    case 3: {
      const existMp = user.stat.mp;
      user.increaseHpMp(0, user.stat.maxMp * 0.6);
      try {
        socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: user.stat.mp }));
      } catch (error) {
        logger.error('MP 설정 중 오류 발생:', error);
      }
      sendBattleLog(`구원의 손길! 마나가 ${user.stat.mp - existMp}만큼 회복되었습니다!`);
      break;
    }

    case 4:
      user.stat.protect = true;
      sendBattleLog('영혼 분쇄! 상대방의 공격력이 쇄약해졌습니다!');
      break;

    default:
      logger.warn(`유저에게 적용할 버프가 없습니다.: ${user.stat.buff}`);
      break;
  }
};