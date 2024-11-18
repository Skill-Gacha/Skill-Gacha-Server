import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import sessionManager from '#managers/SessionManager.js';

export default async function handleGameOverLoseResponse(responseCode, dungeon, user, socket) {
  if (responseCode === 0) {
    // 플레이어가 '확인' 버튼을 눌렀을 때
    const leaveResponse = createResponse(PacketType.S_LeaveDungeon, {});
    socket.write(leaveResponse);

    // 던전 세션 종료
    sessionManager.removeDungeon(dungeon.sessionId);
  } else {
    // 기타 처리
  }
}
