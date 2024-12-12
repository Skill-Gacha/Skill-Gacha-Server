// src/utils/battle/dungeonHelpers.js

import { createResponse } from '../response/createResponse.js';
import logger from '../log/logger.js';
import { PacketType } from '../../constants/header.js';

// 배틀로그 전송 헬퍼
export function sendBattleLog(socket, msg, btns = [], typingAnimation = false) {
  try {
    const battleLog = { msg, typingAnimation, btns };
    const response = createResponse(PacketType.S_BattleLog, { battleLog });
    socket.write(response);
  } catch (error) {
    logger.error('sendBattleLog 중 오류 발생:', error);
  }
}

// 플레이어 HP/MP 정보를 클라이언트에 전송
export function sendPlayerHpMp(socket, user) {
  try {
    socket.write(createResponse(PacketType.S_SetPlayerHp, { hp: user.stat.hp }));
    socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: user.stat.mp }));
  } catch (error) {
    logger.error('플레이어 HP/MP 전송 중 오류 발생:', error);
  }
}

// 몬스터 HP 정보 전송
export function sendMonsterHpUpdate(socket, monster) {
  try {
    socket.write(
      createResponse(PacketType.S_SetMonsterHp, {
        monsterIdx: monster.monsterIdx,
        hp: monster.monsterHp,
      }),
    );
  } catch (error) {
    logger.error('몬스터 HP 전송 중 오류 발생:', error);
  }
}

// 플레이어 액션 전송
export function sendPlayerAction(socket, targetMonsterIdxs, animCode, effectCode) {
  const actionPayload = {
    targetMonsterIdx: targetMonsterIdxs,
    actionSet: {
      animCode,
      effectCode,
    },
  };
  socket.write(createResponse(PacketType.S_PlayerAction, actionPayload));
}

// 몬스터 액션 전송
export function sendMonsterAction(socket, monsterIdx, actionSet) {
  const payload = {
    actionMonsterIdx: monsterIdx,
    actionSet,
  };
  socket.write(createResponse(PacketType.S_MonsterAction, payload));
}

// 스크린 텍스트 전송
export function sendScreenText(socket, msg, typingAnimation = false) {
  const screenText = {
    msg,
    typingAnimation,
  };
  socket.write(createResponse(PacketType.S_ScreenText, { screenText }));
}

// 스크린 텍스트 완료 패킷 전송
export function sendScreenDone(socket) {
  socket.write(createResponse(PacketType.S_ScreenDone, {}));
}

// 던전 떠나기 패킷 전송
export function sendLeaveDungeon(socket) {
  socket.write(createResponse(PacketType.S_LeaveDungeon, {}));
}
