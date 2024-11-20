// src/utils/error/invalidResponseCode.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../response/createResponse.js';

export const invalidResponseCode = (socket) => {
  let message;
  message = '잘못된 선택입니다. 다시 시도해주세요.';
  const invalidResponse = createResponse(PacketType.S_BattleLog, {
    battleLog: {
      msg: message,
      typingAnimation: false,
      btns: [],
    },
  });

  socket.write(invalidResponse); // 클라이언트로 에러 로그 전송
};
