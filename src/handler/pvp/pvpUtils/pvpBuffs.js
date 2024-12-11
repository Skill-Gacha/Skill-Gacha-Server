// src/handler/pvp/pvpUtils/pvpBuffs.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import logger from '../../../utils/log/logger.js';

// PvP에서 버프 기술 사용
export const pvpUseBuffSkill = (user, stopper) => {
  const disableButtons = [{ msg: stopper.nickname, enable: false }];

  const sendBattleLog = (msg) => {
    try {
      user.socket.write(
        createResponse(PacketType.S_PvpBattleLog, {
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

    case 2:
      const existHp = user.stat.hp;
      user.increaseHpMp(user.stat.maxHp * 0.3, 0); // 최대 체력의 30% 회복
      try {
        user.socket.write(createResponse(PacketType.S_SetPvpPlayerHp, { hp: user.stat.hp }));
        stopper.socket.write(createResponse(PacketType.S_SetPvpEnemyHp, { hp: user.stat.hp }));
      } catch (error) {
        logger.error('소켓 쓰기 중 오류 발생:', error);
      }
      sendBattleLog(`치유의 손길! 체력이 ${user.stat.hp - existHp}만큼 회복되었습니다!`);
      break;

    case 3:
      const existMp = user.stat.mp;
      user.increaseHpMp(0, user.stat.maxMp * 0.6); // 최대 마나의 30% 회복
      try {
        user.socket.write(createResponse(PacketType.S_SetPvpPlayerMp, { mp: user.stat.mp }));
      } catch (error) {
        logger.error('소켓 쓰기 중 오류 발생:', error);
      }
      sendBattleLog(`구원의 손길! 마나가 ${user.stat.mp - existMp}만큼 회복되었습니다!`);
      break;

    case 4:
      user.stat.protect = true;
      sendBattleLog('영혼 분쇄! 상대방의 공격력이 쇄약해졌습니다!');
      break;

    default:
      logger.info(`유저에게 버프가 존재하지 않습니다.: ${user.stat.buff}`);
      break;
  }
};
