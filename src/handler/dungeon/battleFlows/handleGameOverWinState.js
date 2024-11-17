// src/handler/dungeon/battleFlows/handleGameOverWinState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import sessionManager from '#managers/SessionManager.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

export default async function handleGameOverWinState(responseCode, dungeon, user, socket) {
  dungeon.dungeonStatus = DUNGEON_STATUS.GAME_OVER_WIN;

  // 던전 클리어 메시지 전송
  socket.write(
    createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '던전을 클리어 하였습니다!',
        typingAnimation: true,
      },
    }),
  );

  // 보상 처리
  // TODO: 보상 로직 구현

  // 던전 세션 종료
  sessionManager.removeDungeon(dungeon.sessionId);
}
