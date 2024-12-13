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

  // `actualMatchedPlayers` 변수를 `try` 블록 외부에 선언
  let actualMatchedPlayers = [];

  try {
    if (accept) {
      const matchedPlayers = await queueManager.addMatchingQueue(user, MAX_PLAYER, 'boss');

      if (!matchedPlayers) {
        logger.info('매칭 대기 중입니다.');
        return;
      }

      // 매칭된 사용자들 중 유효한 사용자만 필터링
      actualMatchedPlayers = matchedPlayers
        .map((player) => sessionManager.getUser(player.id))
        .filter((u) => u !== undefined && u !== null);

      if (actualMatchedPlayers.length < MAX_PLAYER) {
        logger.warn('매칭된 사용자 중 일부가 유효하지 않습니다.');
        // 유효하지 않은 사용자 제거
        await Promise.all(
          matchedPlayers.map(async (player) => {
            const u = sessionManager.getUser(player.id);
            if (u) {
              await queueManager.removeAcceptQueueInUser(u);
              u.setMatched(false);
            }
          })
        );
        return;
      }

      // 모든 사용자가 수락했으므로 매칭 완료
      await Promise.all(
        actualMatchedPlayers.map(async (u) => {
          await queueManager.removeAcceptQueueInUser(u);
          u.setMatched(false);
        })
      );

      const [playerA, playerB, playerC] = actualMatchedPlayers;
      const monsterData = getGameAssets().MonsterData.data;
      const bossMonster = monsterData[BOSS_NUMBER];
      const bossMonsterInstance = new Monster(
        BOSS_IDX,
        bossMonster.monsterModel,
        bossMonster.monsterName,
        bossMonster.monsterHp,
        bossMonster.monsterAtk,
        bossMonster.monsterEffectCode,
        bossMonster
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
      actualMatchedPlayers.forEach((u) => {
        sDespawnHandler(u);
        sendBossMatchNotification(
          u,
          playerIds,
          partyList,
          boss,
          u.id === playerA.id // 첫 번째 플레이어에게만 버튼 활성화
        );
      });

      if (!bossRoom.currentState) {
        const BossActionState = (await import('./states/action/bossActionState.js')).default;
        bossRoom.currentState = new BossActionState(bossRoom, bossRoom.userTurn);
        await bossRoom.currentState.enter();
        logger.info(`BossActionState가 성공적으로 초기화되었습니다.`);
      }
    } else {
      const failResponse = createResponse(PacketType.S_BossMatchNotification, {
        success: false,
        playerIds: [],
        partyList: [],
      });

      const acceptQueue = queueManager.getAcceptQueue();
      const waitingJobs = await acceptQueue.getJobs(['waiting']);

      await Promise.all(
        waitingJobs.map(async (job) => {
          const userId = job.data.id;
          const u = sessionManager.getUser(userId);
          if (u) {
            u.socket.write(failResponse);
            await queueManager.removeMatchingQueue(u, 'boss');
            await queueManager.removeAcceptQueueInUser(u);
            u.setMatched(false);
          }
        })
      );
    }
  } catch (error) {
    logger.error('cBossAcceptResponseHandler: 오류입니다.', error);
    // 예외 발생 시 큐에서 사용자 제거 및 매칭 상태 해제
    if (actualMatchedPlayers && actualMatchedPlayers.length > 0) {
      await Promise.all(
        actualMatchedPlayers.map(async (player) => {
          const u = sessionManager.getUser(player.id);
          if (u) {
            await queueManager.removeAcceptQueueInUser(u);
            u.setMatched(false);
          }
        })
      );
    }
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

// 헬퍼 파일을 그대로 유지
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
