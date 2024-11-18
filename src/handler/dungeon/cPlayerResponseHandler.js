// src/handlers/cPlayerResponseHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '../../managers/SessionManager.js';
import sPlayerActionHandler from './sPlayerActionHandler.js';
import { sMonsterActionHandler } from './sMonsterActionHandler.js';
import { delay } from './delay.js';
import { D_STATE_BATTLE, D_STATE_END, D_STATE_PLAYER_DEAD } from '../../constants/battle.js';
import { findUserMoney } from '../../db/user/user.db.js';

export const cPlayerResponseHandler = async ({ socket, payload }) => {
  const { responseCode } = payload;
  const user = sessionManager.getUserBySocket(socket);

  if (!user) {
    console.error('cPlayerResponseHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  const dungeon = sessionManager.getSessionByUserId(user.id);

  if (!dungeon) {
    console.error('cPlayerResponseHandler: 던전 세션을 찾을 수 없습니다.');
    return;
  }

  const aliveMonsters = dungeon.monsters.filter((monster) => monster.monsterHp > 0);

  if (responseCode === 0) {
    if (user.stat.hp <= 0 || aliveMonsters.length === 0) {
      sessionManager.removeDungeon(dungeon.sessionId);
      const leaveResponse = createResponse(PacketType.S_LeaveDungeon, {});
      user.socket.write(leaveResponse);
      console.log(`유저 ${user.id}가 던전 ${dungeon.sessionId}에서 나갔습니다.`);
      return;
    }
    const screenDoneResponse = createResponse(PacketType.S_ScreenDone, {});
    user.socket.write(screenDoneResponse);
  } else {
    await sPlayerActionHandler(user, dungeon, responseCode);
    await delay(1000);
    await sMonsterActionHandler(user, dungeon, responseCode);
  }
};

export default cPlayerResponseHandler;
