// src/handler/dungeon/battleFlows/handleGameOverLoseState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import sessionManager from '#managers/SessionManager.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

export default async function handleGameOverLoseState(dungeon, user) {
  dungeon.dungeonStatus = DUNGEON_STATUS.MESSAGE;

  // 사망 메시지 전송
  user.socket.write(
    createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '당신은 사망하였습니다...',
        typingAnimation: true,
      },
    }),
  );

  const leaveResponse = createResponse(PacketType.S_LeaveDungeon, {});
  user.socket.write(leaveResponse);

  // 던전 세션 종료
  sessionManager.removeDungeon(dungeon.sessionId);
}
