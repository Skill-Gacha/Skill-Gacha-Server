// src/handler/pvp/cPlayerMatchHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { v4 as uuidv4 } from 'uuid';
import { MyStatus, OpponentStatus } from '../../utils/battle/battle.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';
import checkBatchim from '../../utils/korean/checkBatchim.js';
import { MAX_PLAYER } from '../../constants/pvp.js';

const DUNGEON_CODE_BASE = 5000;
const DUNGEON_CODE_RANGE = 3;
const BUTTON_OPTIONS = ['스킬 사용', '아이템 사용', '턴 넘기기', '도망치기'];

export const cPlayerMatchHandler = async ({ socket }) => {
  const user = sessionManager.getUserBySocket(socket);

  if (!user) {
    logger.error('cPlayerMatchHandler: 유저가 존재하지 않습니다.');
    return;
  }

  socket.write(createResponse(PacketType.S_PlayerMatch, { check: true }));

  const matchedPlayers = sessionManager.addMatchingQueue(user, MAX_PLAYER, 'pvp');

  if (!matchedPlayers) return;

  const [playerA, playerB] = matchedPlayers;
  const pvpRoom = sessionManager.createPvpRoom(uuidv4());

  pvpRoom.addUser(playerA);
  pvpRoom.addUser(playerB);

  try {
    sDespawnHandler(playerA);
    sDespawnHandler(playerB);
  } catch (error) {
    logger.error('cPlayerMatchHandler: 디스폰 처리 중 오류 발생:', error);
    return;
  }

  const dungeonCode = Math.floor(Math.random() * DUNGEON_CODE_RANGE + 1) + DUNGEON_CODE_BASE;
  pvpRoom.initializeTurn();
  const isFirstAttack = pvpRoom.getUserTurn();

  const lastKoreanA = checkBatchim(playerB.nickname) ? '과' : '와';
  const lastKoreanB = checkBatchim(playerA.nickname) ? '과' : '와';

  const responseA = createResponse(PacketType.S_PlayerMatchNotification, {
    dungeonCode,
    playerData: MyStatus(playerA),
    opponentData: OpponentStatus(playerB),
    battleLog: createBattleLogResponse(
      generateBattleLog(playerB.nickname, lastKoreanA, isFirstAttack, '선공입니다.'),
      isFirstAttack,
      [true, true, true, true],
    ),
  });

  const responseB = createResponse(PacketType.S_PlayerMatchNotification, {
    dungeonCode,
    playerData: MyStatus(playerB),
    opponentData: OpponentStatus(playerA),
    battleLog: createBattleLogResponse(
      generateBattleLog(playerA.nickname, lastKoreanB, !isFirstAttack, '후공입니다.'),
      !isFirstAttack,
      [false, false, false, false],
    ),
  });

  playerA.socket.write(responseA);
  playerB.socket.write(responseB);

  pvpRoom.startTurnTimer();
};

const generateBattleLog = (nickname, suffix, isFirstAttack, turn) => {
  const attackOrder = isFirstAttack ? '선공입니다.' : '후공입니다.';
  return `${nickname}${suffix} 싸워 이기세요!\n${turn}`;
};

const createBattleLogResponse = (msg, isFirstAttack, enableButtons) => ({
  msg,
  typingAnimation: false,
  btns: BUTTON_OPTIONS.map((btn, idx) => ({
    msg: btn,
    enable: enableButtons[idx],
  })),
});
