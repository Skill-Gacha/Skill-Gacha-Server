// src/handler/pvp/cPlayerMatchHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { v4 as uuidv4 } from 'uuid';
import { MyStatus, OpponentStatus } from '../../utils/battle/battle.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';
import checkBatchim from '../../utils/korean/checkBatchim.js';
import logger from '../../utils/log/logger.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';
import QueueManager from '#managers/queueManager.js';
import { DUNGEON_CODE_BASE, DUNGEON_CODE_RANGE, MAX_PLAYER } from '../../constants/pvp.js';
import { createBattleLogResponse, generateBattleLog } from '../../utils/battle/pvpHelpers.js';

export const cPlayerMatchHandler = async ({ socket }) => {
  const sessionManager = serviceLocator.get(SessionManager);
  const queueManager = serviceLocator.get(QueueManager);
  const user = sessionManager.getUserBySocket(socket);

  if (!user) {
    logger.error('cPlayerMatchHandler: 유저가 존재하지 않습니다.');
    return;
  }

  queueManager.removeMatchingQueue(user, 'boss');
  socket.write(createResponse(PacketType.S_PlayerMatch, { check: true }));

  const matchedPlayers = await queueManager.addMatchingQueue(user, MAX_PLAYER, 'pvp');
  if (!matchedPlayers) {
    logger.info('매칭 대기 중입니다.');
    return;
  }

  const matchedUsers = matchedPlayers.map(({ id }) => sessionManager.getUser(id));
  const [playerOne, playerTwo] = matchedUsers;

  const pvpRoom = sessionManager.createPvpRoom(uuidv4());
  pvpRoom.addUser(playerOne);
  pvpRoom.addUser(playerTwo);

  try {
    sDespawnHandler(playerOne);
    sDespawnHandler(playerTwo);
  } catch (error) {
    logger.error('cPlayerMatchHandler: 디스폰 처리 중 오류 발생:', error);
    return;
  }

  const dungeonCode = Math.floor(Math.random() * DUNGEON_CODE_RANGE + 1) + DUNGEON_CODE_BASE;
  pvpRoom.initializeTurn();

  const isPlayerAFirstAttack = (pvpRoom.getUserTurn() === 0);
  const isPlayerBFirstAttack = !isPlayerAFirstAttack;

  const lastKoreanA = checkBatchim(playerTwo.nickname) ? '과' : '와';
  const lastKoreanB = checkBatchim(playerOne.nickname) ? '과' : '와';

  const battleLogA = generateBattleLog(
    playerTwo.nickname,
    lastKoreanA,
    isPlayerAFirstAttack,
    isPlayerAFirstAttack ? '선공입니다.' : '후공입니다.',
  );

  const battleLogB = generateBattleLog(
    playerOne.nickname,
    lastKoreanB,
    isPlayerBFirstAttack,
    isPlayerBFirstAttack ? '선공입니다.' : '후공입니다.',
  );

  playerOne.socket.write(
    createResponse(PacketType.S_PlayerMatchNotification, {
      dungeonCode,
      playerData: MyStatus(playerOne),
      opponentData: OpponentStatus(playerTwo),
      battleLog: createBattleLogResponse(battleLogA, isPlayerAFirstAttack),
    }),
  );

  playerTwo.socket.write(
    createResponse(PacketType.S_PlayerMatchNotification, {
      dungeonCode,
      playerData: MyStatus(playerTwo),
      opponentData: OpponentStatus(playerOne),
      battleLog: createBattleLogResponse(battleLogB, isPlayerBFirstAttack),
    }),
  );

  pvpRoom.startTurnTimer();
};
