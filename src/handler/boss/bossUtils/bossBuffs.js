// src/handler/boss/bossUtils/bossBuffs.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import logger from '../../../utils/log/logger.js';

// 보스 전투에서 버프 또는 디버프 기술 사용
export const bossBuffOrDebuffSkill = (user, socket, bossRoom) => {
  const users = bossRoom.getUsers();
  const playerIds = users.map((u) => u.id);
  const hps = users.map((u) => u.stat.hp);
  const mps = users.map((u) => u.stat.mp);

  const disableButtons = bossRoom.monsters.map((monster) => ({
    msg: monster.monsterName,
    enable: false,
  }));

  const sendBattleLog = (msg) => {
    try {
      socket.write(
        createResponse(PacketType.S_BossBattleLog, {
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

  const notificationPlayers = () => {
    try {
      users.forEach((u) => {
        u.socket.write(
          createResponse(PacketType.S_BossPlayerStatusNotification, {
            playerId: playerIds,
            hp: hps,
            mp: mps,
          }),
        );
      });
    } catch (error) {
      logger.error('소켓 쓰기 중 오류 발생:', error);
    }
  };

  switch (user.stat.buff) {
    case 1:
      user.stat.battleCry = true;
      notificationPlayers();
      sendBattleLog(`전투의 함성! \n아군의 공격력이 두 배로 증가했습니다!`);
      break;

    case 2:
      const existHp = user.stat.hp;
      user.increaseHpMp(user.stat.maxHp * 0.3, 0); // 최대 체력의 30% 회복
      notificationPlayers();
      sendBattleLog(`치유의 손길! \n체력이 ${user.stat.hp - existHp}만큼 회복되었습니다!`);
      break;

    case 3:
      user.increaseHpMp(0, user.stat.maxMp * 0.3); // 최대 마나의 30% 회복
      notificationPlayers();
      sendBattleLog(` 구원의 손길! \n시전자를 제외한 유저의 마나가 90 회복되었습니다!`);
      break;

    case 4:
      user.stat.protect = true;
      notificationPlayers();
      sendBattleLog(`영혼 분쇄! \n상대방의 공격력이 쇄약해졌습니다!`);
      break;

    default:
      logger.warn(`유저에게 버프가 존재하지 않습니다.: ${user.stat.buff}`);
      break;
  }
};
