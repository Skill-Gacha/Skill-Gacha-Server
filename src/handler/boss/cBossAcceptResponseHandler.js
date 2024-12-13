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
import AsyncLock from 'async-lock';

const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기'];
const BOSS_NUMBER = 28;
const BOSS_IDX = 0;

// 핸들러 레벨의 락 추가
const handlerLock = new AsyncLock();

export const cBossAcceptResponseHandler = async ({ socket, payload }) => {
  const sessionManager = serviceLocator.get(SessionManager);
  const queueManager = serviceLocator.get(QueueManager);
  const user = sessionManager.getUserBySocket(socket);
  const { accept } = payload; // sessionId 포함하지 않음

  if (!user) {
    logger.error('cBossAcceptResponseHandler: 유저가 존재하지 않습니다.');
    return;
  }

  try {
    await handlerLock.acquire('cBossAcceptResponseHandler', async () => {
      // 유저가 속한 그룹 찾기
      let userGroupId = null;
      for (const [groupId, group] of queueManager.pendingGroups.entries()) {
        if (group.userIds.has(user.id)) {
          userGroupId = groupId;
          break;
        }
      }

      if (!userGroupId) {
        logger.error('cBossAcceptResponseHandler: 유저가 매칭 그룹에 속해 있지 않습니다.');
        return;
      }

      const group = queueManager.pendingGroups.get(userGroupId);
      if (!group) {
        logger.error('cBossAcceptResponseHandler: 매칭 그룹을 찾을 수 없습니다.');
        return;
      }

      if (accept) {
        // 유저를 수락된 목록에 추가
        group.acceptedIds.add(user.id);
        logger.info(`유저 ${user.id}가 매칭을 수락했습니다.`);

        // 모든 유저가 수락했는지 확인
        if (group.acceptedIds.size === group.userIds.size) {
          // 모든 유저가 수락했으므로 매칭 완료
          queueManager.pendingGroups.delete(userGroupId);

          const actualMatchedPlayers = Array.from(group.userIds)
            .map((uid) => sessionManager.getUser(uid))
            .filter((u) => u !== undefined && u !== null);

          if (actualMatchedPlayers.length < MAX_PLAYER) {
            logger.warn('매칭된 사용자 중 일부가 유효하지 않습니다.');
            // 유효하지 않은 사용자 제거
            await Promise.all(
              actualMatchedPlayers.map(async (u) => {
                await queueManager.removeAcceptQueueInUser(u);
                u.setMatched(false);
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
            logger.info('BossActionState가 성공적으로 초기화되었습니다.');
          }
        }
      } else {
        // 유저가 매칭을 거부한 경우
        logger.info(`유저 ${user.id}가 매칭을 거부했습니다.`);

        // 그룹을 취소하고 모든 유저에게 실패 응답 전송
        const failResponse = createResponse(PacketType.S_BossMatchNotification, {
          success: false,
          playerIds: [],
          partyList: [],
        });

        await Promise.all(
          Array.from(group.userIds).map(async (uid) => {
            const u = sessionManager.getUser(uid);
            if (u) {
              u.socket.write(failResponse);
              await queueManager.removeMatchingQueue(u, 'boss');
              await queueManager.removeAcceptQueueInUser(u);
              u.setMatched(false);
            }
          })
        );

        queueManager.pendingGroups.delete(userGroupId);
      }
    });
  } catch (error) {
    logger.error('cBossAcceptResponseHandler: 오류입니다.', error);
    // 예외 발생 시 큐에서 사용자 제거 및 매칭 상태 해제
    // 해당 그룹을 찾고 모든 유저를 클린업
    let userGroupId = null;
    for (const [groupId, group] of queueManager.pendingGroups.entries()) {
      if (group.userIds.has(user.id)) {
        userGroupId = groupId;
        break;
      }
    }

    if (userGroupId && queueManager.pendingGroups.has(userGroupId)) {
      const group = queueManager.pendingGroups.get(userGroupId);
      await Promise.all(
        Array.from(group.userIds).map(async (uid) => {
          const u = sessionManager.getUser(uid);
          if (u) {
            await queueManager.removeAcceptQueueInUser(u);
            u.setMatched(false);
          }
        })
      );
      queueManager.pendingGroups.delete(userGroupId);
    }
  }
};

const createBattleLogResponse = (enable) => ({
  msg: '보스전에 입장하였습니다.',
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
