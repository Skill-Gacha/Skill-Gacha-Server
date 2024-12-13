// src/handler/boss/cBossAcceptResponseHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { v4 as uuidv4 } from 'uuid';
import { MyStatus } from '../../utils/battle/battle.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';
import { MAX_PLAYER } from '../../constants/boss.js';
import { getGameAssets } from '../../init/loadAssets.js';
import Monster from '../../classes/models/monsterClass.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';
import QueueManager from '#managers/queueManager.js';
import logger from '../../utils/log/logger.js';

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];
const BOSS_NUMBER = 28;
const BOSS_IDX = 0;

export const cBossAcceptResponseHandler = async ({ socket, payload }) => {
  const sessionManager = serviceLocator.get(SessionManager);
  const queueManager = serviceLocator.get(QueueManager);
  const user = sessionManager.getUserBySocket(socket);
  const { accept } = payload;

  if (!user) {
    logger.error('cBossAcceptResponseHandler: 유저가 존재하지 않습니다.');
    return;
  }

  try {
    if (accept) {
      const matchedPlayers = await queueManager.addMatchingQueue(user, MAX_PLAYER, 'boss');
      if (!matchedPlayers) return;

      const actualMatchedPlayers = matchedPlayers.map((player) =>
        sessionManager.getUser(player.id),
      );

      // 모든 매칭된 유저의 acceptQueue에서 제거
      await Promise.all(
        actualMatchedPlayers.map((u) => queueManager.removeAcceptQueueInUser(u)),
      );

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
      bossRoom.setUsers(...actualMatchedPlayers);
      bossRoom.addMonster(bossMonsterInstance);

      const playerIds = actualMatchedPlayers.map((player) => player.id);
      const partyList = actualMatchedPlayers.map((player) => MyStatus(player));
      const boss = {
        monsterIdx: BOSS_IDX,
        monsterModel: bossMonster.monsterModel,
        monsterName: bossMonster.monsterName,
        monsterHp: bossMonster.monsterHp,
      };

      actualMatchedPlayers.forEach((user) => {
        sDespawnHandler(user);
        sendBossMatchNotification(
          user,
          playerIds,
          partyList,
          boss,
          user.id === actualMatchedPlayers[0].id, // 첫 번째 유저가 리더라고 가정
        );
      });

      if (!bossRoom.currentState) {
        const { default: BossActionState } = await import('./states/action/bossActionState.js');
        bossRoom.currentState = new BossActionState(bossRoom, bossRoom.userTurn);
        await bossRoom.currentState.enter();
      }
    } else {
      await handleBossMatchDecline(queueManager, sessionManager);
    }
  } catch (error) {
    logger.error('cBossAcceptResponseHandler: 오류입니다.', error);
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

// 헬퍼 함수는 별도의 파일로 분리하지 않고 그대로 유지
const sendBossMatchNotification = (player, playerIds, partyList, monsterStatus, enable) => {
  const response = createResponse(PacketType.S_BossMatchNotification, {
    success: true,
    playerIds,
    partyList,
    battleLog: createBattleLogResponse(enable),
    monsterStatus,
  });
  player.socket.write(response);
};

// 보스 매칭 거절 시 처리
const handleBossMatchDecline = async (queueManager, sessionManager) => {
  const failResponse = createResponse(PacketType.S_BossMatchNotification, {
    success: false,
    playerIds: [],
    partyList: [],
  });

  const acceptQueue = queueManager.getAcceptQueue();
  const waitingJobs = await acceptQueue.getWaiting();

  await Promise.all(
    waitingJobs.map(async (job) => {
      const userId = job.data.id;
      const user = sessionManager.getUser(userId);
      if (user) {
        user.socket.write(failResponse);
        await queueManager.removeMatchingQueue(user, 'boss');
        await queueManager.removeAcceptQueueInUser(user);
      }
    }),
  );
};
