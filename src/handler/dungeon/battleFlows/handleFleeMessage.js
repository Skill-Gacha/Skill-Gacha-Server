// src/handler/dungeon/battleFlows/handleFleeMessage.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import sessionManager from '#managers/SessionManager.js';

export default async function handleFleeMessage(responseCode, dungeon, user, socket) {
  if (responseCode === 0) { // '확인' 버튼을 눌렀을 때
    // 던전 퇴장 패킷 전송
    const leaveResponse = createResponse(PacketType.S_LeaveDungeon, {});
    socket.write(leaveResponse);

    // 던전 세션에서 제거
    sessionManager.removeDungeon(dungeon.sessionId);

    console.log(`유저 ${user.id}가 던전을 퇴장했습니다.`);
  } else {
    // 유효하지 않은 입력 처리
    const invalidResponse = createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '잘못된 선택입니다.',
        typingAnimation: false,
        btns: [],
      },
    });
    socket.write(invalidResponse);
  }
}
