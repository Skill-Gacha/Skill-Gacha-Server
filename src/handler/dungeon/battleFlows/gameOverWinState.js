// src/handler/dungeon/battleFlows/gameOverWinState.js

import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';

const gameOverWinState = (responseCode, dungeon, user) => {
  user.socket.write(
    createResponse(PacketType.S_ScreenText, {
      msg: '전투에서 승리하였습니다!',
      typingAnimation: true,
    }),
  );
  
  // 승리 DB 기록

  // 던전 세션 제거
  // 어디서 해야하지?
  // removeDungeonSession(dungeon.sessionId);
};

export default gameOverWinState;
