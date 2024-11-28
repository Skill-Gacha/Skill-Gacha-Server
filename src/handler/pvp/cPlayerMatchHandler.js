// src/handler/pvp/cPlayerMathHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { v4 as uuidv4 } from 'uuid';
import { MyStatus, OpponentStatus } from '../../utils/battle/battle.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';
import checkBatchim from '../../utils/korean/checkBatchim.js';

export const cPlayerMatchHandler = async ({ socket }) => {
  const user = sessionManager.getUserBySocket(socket);

  if (!user) {
    console.error('cPlayerMatchHandler: 유저가 존재하지 않습니다.');
    return;
  }

  user.socket.write(createResponse(PacketType.S_PlayerMatch, { check: true }));

  const matchedPlayers = sessionManager.addMatchingQueue(user);

  if (!matchedPlayers) return;

  const [playerA, playerB] = matchedPlayers;
  const pvpRoom = sessionManager.createPvpRoom(uuidv4());

  pvpRoom.addUser(playerA);
  pvpRoom.addUser(playerB);

  try {
    sDespawnHandler(playerA);
    sDespawnHandler(playerB);
  } catch (error) {
    console.error('cPlayerMatchHandler: 디스폰 처리 중 오류 발생:', error);
  }

  const dungeonCode = Math.floor(Math.random() * 3 + 1) + 5000;
  pvpRoom.initializeTurn();
  const isFirstAttack = pvpRoom.getUserTurn();

  const lastKoreanA = checkBatchim(playerB.nickname) ? '과' : '와';
  const lastKoreanB = checkBatchim(playerA.nickname) ? '과' : '와';

  const responseA = createResponse(PacketType.S_PlayerMatchNotification, {
    dungeonCode,
    playerData: MyStatus(playerA),
    opponentData: OpponentStatus(playerB),
    battleLog: {
      msg: `${playerB.nickname}${lastKoreanA} 싸워 이기세요!\n${isFirstAttack ? '선공입니다.' : '후공입니다'}`,
      typingAnimation: false,
      btns: [
        { msg: '스킬 사용', enable: isFirstAttack },
        { msg: '아이템 사용', enable: isFirstAttack },
        { msg: '턴 넘기기', enable: isFirstAttack },
        { msg: '도망치기', enable: isFirstAttack },
      ],
    },
  });

  const responseB = createResponse(PacketType.S_PlayerMatchNotification, {
    dungeonCode,
    playerData: MyStatus(playerB),
    opponentData: OpponentStatus(playerA),
    battleLog: {
      msg: `${playerA.nickname}${lastKoreanB} 싸워 이기세요!\n${isFirstAttack ? '후공입니다' : '선공입니다.'}`,
      typingAnimation: false,
      btns: [
        { msg: '스킬 사용', enable: !isFirstAttack },
        { msg: '아이템 사용', enable: !isFirstAttack },
        { msg: '턴 넘기기', enable: !isFirstAttack },
        { msg: '도망치기', enable: !isFirstAttack },
      ],
    },
  });

  playerA.socket.write(responseA);
  playerB.socket.write(responseB);
};
