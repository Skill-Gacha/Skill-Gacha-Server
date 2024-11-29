// src/handler/boss/cBossAcceptResponseHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { v4 as uuidv4 } from 'uuid';
import { MemberStatus, MyStatus } from '../../utils/battle/battle.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';
import { DUNGEON_CODE, MAX_PLAYER } from '../../constants/boss.js';

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];

export const cBossAcceptResponseHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);

  if (!user) {
    console.error('cPlayerMatchHandler: 유저가 존재하지 않습니다.');
    return;
  }

  try {
    // 수락했을 때 처리
    if (payload === true) {
      const matchedPlayers = sessionManager.addMatchingQueue(user, MAX_PLAYER, 'boss');
      if (!matchedPlayers) return;
      const [playerA, playerB, playerC] = matchedPlayers;
      const bossRoom = sessionManager.createbossRoom(uuidv4());
      bossRoom.setUsers(playerA, playerB, playerC);
      sDespawnHandler(playerA);
      sDespawnHandler(playerB);
      sDespawnHandler(playerC);
      const dungeonCode = DUNGEON_CODE;

      const responseA = createResponse(PacketType.S_BossMatchNotification, {
        success: true,
        member: [MemberStatus(playerB), MemberStatus(playerC)],
        dungeonCode,
        battleLog: createBattleLogResponse(true),
        player: MyStatus(playerA),
      });

      const responseB = createResponse(PacketType.S_BossMatchNotification, {
        success: true,
        member: [MemberStatus(playerA), MemberStatus(playerC)],
        dungeonCode,
        battleLog: createBattleLogResponse(false),
        player: MyStatus(playerB),
      });

      const responseC = createResponse(PacketType.S_BossMatchNotification, {
        success: true,
        member: [MemberStatus(playerA), MemberStatus(playerB)],
        dungeonCode,
        battleLog: createBattleLogResponse(false),
        player: MyStatus(playerC),
      });

      playerA.socket.write(responseA);
      playerB.socket.write(responseB);
      playerC.socket.write(responseC);

      bossRoom.startTurnTimer();
    }

    // 거절했을 때 처리
    else {
      // 입장 실패 패킷
      const failResponse = createResponse(PacketType.S_BossMatchNotification, {
        success: false,
        member: [],
      });

      sessionManager.removeMatchingQueue(user, 'boss');
      user.socket.write(failResponse);

      // 먼저 수락한 유저도 매칭큐에서 제거 및 입장 실패 패킷 전송
      const matchingQueue = sessionManager.getMatchingQueue('boss');
      matchingQueue.forEach((player) => {
        player.socket.write(failResponse);
        sessionManager.removeMatchingQueue(player, 'boss');
      });
    }
  } catch (error) {
    console.error('cBossAcceptResponseHandler: 오류입니다.');
  }
};

const createBattleLogResponse = (enable) => ({
  msg: `보스전에 입장하였습니다 ${playerA.nickname}의 차례입니다.`,
  typingAnimation: false,
  btns: BUTTON_OPTIONS.map((btn) => ({
    msg: btn,
    enable: enable,
  })),
});
