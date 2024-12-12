// src/utils/battle/pvpHelpers.js

import { BUTTON_OPTIONS } from '../../constants/pvp.js';
import logger from '../log/logger.js';

// 전투 로그 문자열 생성
export function generateBattleLog(nickname, suffix, isFirstAttack, turnText) {
  return `${nickname}${suffix} 싸워 이기세요!\n${turnText}`;
}

// 전투 로그 응답 생성
export function createBattleLogResponse(msg, isFirstAttack) {
  return {
    msg,
    typingAnimation: false,
    btns: BUTTON_OPTIONS.map((btn) => ({ msg: btn, enable: isFirstAttack })),
  };
}

// 잘못된 응답 로깅
export function sendInvalidResponseLog(socket) {
  logger.error('잘못된 응답 코드가 전달되었습니다.');
  // 필요하다면 socket에 에러 패킷 전송 가능
}
