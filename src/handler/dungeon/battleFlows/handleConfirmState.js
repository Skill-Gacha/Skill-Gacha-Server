// src/handler/dungeon/battleFlows/handleConfirmState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import sessionManager from '#managers/SessionManager.js';
import switchToActionState from '../transition/switchToActionState.js';

export default async function handleConfirmState(responseCode, dungeon, user, socket) {
  // responseCode: 0 - 예, 1 - 아니오
  if (responseCode === 1) {
    // 플레이어가 '예'를 선택한 경우, 던전을 떠납니다.
    socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '전투에서 도망쳤습니다.',
          typingAnimation: true,
        },
      }),
    );

    // 던전 퇴장 패킷 전송
    const leaveResponse = createResponse(PacketType.S_LeaveDungeon, {});
    socket.write(leaveResponse);

    // 던전 세션에서 제거
    sessionManager.removeDungeon(dungeon.sessionId);

    console.log(`유저 ${user.id}가 던전 ${dungeon.dungeonCode}에서 도망쳤습니다.`);
  } else if (responseCode === 2) {
    // 플레이어가 '아니오'를 선택한 경우, 행동 선택 상태로 돌아갑니다.
    await switchToActionState(dungeon, user, socket);
  } else {
    // 유효하지 않은 입력 처리
    const invalidResponse = createResponse(PacketType.S_BattleLog, {
      battleLog: {
        msg: '잘못된 선택입니다. 다시 선택해주세요.',
        typingAnimation: false,
        btns: [],
      },
    });
    socket.write(invalidResponse);
  }
}
