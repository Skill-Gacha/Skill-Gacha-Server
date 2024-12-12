// src/handler/boss/bossUtils/bossBuffs.js

import logger from '../../../utils/log/logger.js';
import { sendBossBattleLog, sendBossPlayerStatus } from '../../../utils/battle/bossHelpers.js';

export const bossBuffOrDebuffSkill = (user, socket, bossRoom) => {
  const users = bossRoom.getUsers();
  const disableButtons = bossRoom.monsters.map((monster) => ({
    msg: monster.monsterName,
    enable: false,
  }));

  switch (user.stat.buff) {
    case 1:
      user.stat.battleCry = true;
      sendBossPlayerStatus(users);
      sendBossBattleLog(user, `전투의 함성! \n아군의 공격력이 두 배로 증가했습니다!`, disableButtons);
      break;

    case 2:
      const existHp = user.stat.hp;
      user.increaseHpMp(user.stat.maxHp * 0.3, 0);
      sendBossPlayerStatus(users);
      sendBossBattleLog(user, `치유의 손길! \n체력이 ${user.stat.hp - existHp}만큼 회복되었습니다!`, disableButtons);
      break;

    case 3:
      const existMp = user.stat.mp;
      user.increaseHpMp(0, user.stat.maxMp * 0.3); // 최대 마나의 30% 회복
      notificationPlayers();
      sendBattleLog(`구원의 손길! \n마나가 ${user.stat.mp - existMp}만큼 회복되었습니다!`);
      break;

    case 4:
      user.stat.protect = true;
      sendBossPlayerStatus(users);
      sendBossBattleLog(user, `영혼 분쇄! \n상대방의 공격력이 쇄약해졌습니다!`, disableButtons);
      break;

    default:
      logger.warn(`유저에게 버프가 존재하지 않습니다.: ${user.stat.buff}`);
      break;
  }
};
