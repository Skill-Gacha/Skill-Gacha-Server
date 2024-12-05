// src/handler/boss/cBossAcceptResponseHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { v4 as uuidv4 } from 'uuid';
import { MyStatus } from '../../utils/battle/battle.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';
import { MAX_PLAYER } from '../../constants/boss.js';
import { getGameAssets } from '../../init/loadAssets.js';
import Monster from '../../classes/models/monsterClass.js';

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];
const BOSS_NUMBER = 28;
const BOSS_IDX = 0;

export const cBossAcceptResponseHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);
  const { accept } = payload;

  if (!user) {
    console.error('cPlayerMatchHandler: 유저가 존재하지 않습니다.');
    return;
  }

  try {
    // 수락했을 때 처리
    if (accept) {
      const matchedPlayers = sessionManager.addMatchingQueue(user, MAX_PLAYER, 'boss');
      if (!matchedPlayers) return;
      const [playerA, playerB, playerC] = matchedPlayers;
      const monsterData = getGameAssets().MonsterData.data;
      const bossMonster = monsterData[BOSS_NUMBER];
      const bossMonsterInstance = new Monster(
        BOSS_IDX,
        bossMonster.monsterModel,
        bossMonster.monsterName,
        bossMonster.monsterHp,
        bossMonster.monsterAtk,
        bossMonster.monsterEffectCode,
        bossMonster,
      );
      const bossRoom = sessionManager.createBossRoom(uuidv4());
      bossRoom.setUsers(playerA, playerB, playerC);
      bossRoom.addMonster(bossMonsterInstance);
      const playerIds = [playerA.id, playerB.id, playerC.id];
      const partyList = [MyStatus(playerA), MyStatus(playerB), MyStatus(playerC)];
      const boss = {
        monsterIdx: BOSS_IDX,
        monsterModel: bossMonster.monsterModel,
        monsterName: bossMonster.monsterName,
        monsterHp: bossMonster.monsterHp,
      };
      matchedPlayers.forEach((user) => {
        sDespawnHandler(user);
        sendBossMatchNotification(
          user,
          playerIds,
          partyList,
          boss,
          user.id === playerA.id ? true : false,
        );
      });

      if (!bossRoom.currentState) {
        const BossActionState = (await import('./states/bossActionState.js')).default;
        bossRoom.currentState = new BossActionState(bossRoom, bossRoom.userTurn);
        await bossRoom.currentState.enter();
      }
    }

    // 거절했을 때 처리
    else {
      // 입장 실패 패킷
      const failResponse = createResponse(PacketType.S_BossMatchNotification, {
        success: false,
        playerIds: [],
        partyList: [],
      });

      sessionManager.removeAcceptQueueInUser(user);
      user.socket.write(failResponse);

      // 먼저 수락한 유저도 매칭큐에서 제거 및 입장 실패 패킷 전송
      const acceptQueue = sessionManager.getAcceptQueue();
      for (let i = 0; i < acceptQueue.length; i++) {
        const user = acceptQueue[i];
        user.socket.write(failResponse);
        sessionManager.removeMatchingQueue(user, 'boss');
        sessionManager.removeAcceptQueueInUser(user);
        i--;
      }
    }
  } catch (error) {
    console.error('cBossAcceptResponseHandler: 오류입니다.', error);
  }
};

const createBattleLogResponse = (enable) => ({
  msg: `보스전에 입장하였습니다.`,
  typingAnimation: false,
  btns: BUTTON_OPTIONS.map((btn) => ({
    msg: btn,
    enable: enable,
  })),
});

const sendBossMatchNotification = (player, playerIds, partyList, monsterStatus, enable) => {
  const battleLog = createBattleLogResponse(enable);
  const response = createResponse(PacketType.S_BossMatchNotification, {
    success: true,
    playerIds,
    partyList,
    battleLog,
    monsterStatus,
  });
  player.socket.write(response);
};
