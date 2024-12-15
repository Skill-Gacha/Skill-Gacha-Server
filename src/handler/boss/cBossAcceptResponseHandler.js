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
    // 이전에는 handlerLock을 사용했으나 제거. 이제 queueManager의 메서드를 통해 처리.
    let userGroupId = null;
    // 그룹 찾는 로직도 queueManager에서 보호하는 것이 좋으나, 여기서는 조회만.
    // 실제 변경 시점(수락/거절)은 queueManager.withPendingGroupsLock에서 처리.
    // 변경 사항: queueManager.withPendingGroupsLock 내부 로직 사용

    await queueManager.withPendingGroupsLock(async () => { // 변경 사항
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
        const result = await queueManager.acceptUserInGroup(user, userGroupId); // 변경 사항: accept 로직 encapsulate
        if (result === false) {
          // 실패 처리 (유효하지 않은 유저 존재)
          return;
        } else if (Array.isArray(result)) {
          // 모든 유저 수락 완료
          const actualMatchedPlayers = result;
          if (actualMatchedPlayers.length < MAX_PLAYER) {
            logger.warn('유효하지 않은 매칭 결과');
            return;
          }

          // 이후 보스룸 생성 로직
          // 유저 버프 초기화
          const [playerA, playerB, playerC] = actualMatchedPlayers;
          actualMatchedPlayers.forEach((user) => {
            user.isDead = false;
            user.stat.buff = null;
            user.stat.battleCry = false;
            user.stat.stimPack = false;
            user.stat.dangerPotion = false;
            user.stat.protect = false;
            user.stat.downResist = false;
            user.completeTurn = false;
          });

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

          actualMatchedPlayers.forEach((u) => {
            sDespawnHandler(u);
            sendBossMatchNotification(
              u,
              playerIds,
              partyList,
              boss,
              u.id === playerA.id
            );
          });

          if (!bossRoom.currentState) {
            const BossActionState = (await import('./states/action/bossActionState.js')).default;
            bossRoom.currentState = new BossActionState(bossRoom, bossRoom.userTurn);
            await bossRoom.currentState.enter();
            logger.info('BossActionState가 성공적으로 초기화되었습니다.');
          }
        }
        // 부분 수락 상태면 아직 아무것도 안 함
      } else {
        // 거절한 경우 그룹 전체 실패 처리
        await queueManager.rejectGroup(userGroupId); // 변경 사항: 거절 로직 queueManager로 이동
      }
    });
  } catch (error) {
    logger.error('cBossAcceptResponseHandler: 오류입니다.', error);

    // 예외 발생 시에도 그룹 정리 로직 수행
    await queueManager.withPendingGroupsLock(async () => {
      let userGroupId = null;
      for (const [groupId, group] of queueManager.pendingGroups.entries()) {
        if (group.userIds.has(user.id)) {
          userGroupId = groupId;
          break;
        }
      }

      if (userGroupId) {
        await queueManager.rejectGroup(userGroupId); // 예외 시에도 그룹 제거
      }
    });
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
