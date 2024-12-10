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

  switch (user.stat.buff) {
    case 1:
      user.stat.battleCry = true;
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

        socket.write(
          createResponse(PacketType.S_BossBattleLog, {
            battleLog: {
              msg: `전투의 함성! \n아군의 공격력이 두 배로 증가했습니다!`,
              typingAnimation: false,
              btns: disableButtons,
            },
          }),
        );
      } catch (error) {
        logger.error('소켓 쓰기 중 오류 발생:', error);
      }
      break;

    case 2:
      const existHp = user.stat.hp;
      user.increaseHpMp(user.stat.maxHp * 0.3, 0); // 최대 체력의 30% 회복

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

        socket.write(
          createResponse(PacketType.S_BossBattleLog, {
            battleLog: {
              msg: `치유의 손길! \n체력이 ${user.stat.hp - existHp}만큼 회복되었습니다!`,
              typingAnimation: false,
              btns: disableButtons,
            },
          }),
        );
      } catch (error) {
        logger.error('소켓 쓰기 중 오류 발생:', error);
      }
      break;

    case 3:
      const existMp = user.stat.mp;
      user.increaseHpMp(0, user.stat.maxMp * 0.3); // 최대 마나의 30% 회복

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

        socket.write(
          createResponse(PacketType.S_BossBattleLog, {
            battleLog: {
              msg: `구원의 손길! \n마나가 ${user.stat.mp - existMp}만큼 회복되었습니다!`,
              typingAnimation: false,
              btns: disableButtons,
            },
          }),
        );
      } catch (error) {
        logger.error('소켓 쓰기 중 오류 발생:', error);
      }
      break;

    case 4:
      user.stat.protect = true;
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

        socket.write(
          createResponse(PacketType.S_BossBattleLog, {
            battleLog: {
              msg: `영혼 분쇄! \n상대방의 공격력이 쇄약해졌습니다!`,
              typingAnimation: false,
              btns: disableButtons,
            },
          }),
        );
      } catch (error) {
        logger.error('소켓 쓰기 중 오류 발생:', error);
      }
      break;

    default:
      logger.warn(`유저에게 버프가 존재하지 않습니다.: ${user.stat.buff}`);
      break;
  }
};
