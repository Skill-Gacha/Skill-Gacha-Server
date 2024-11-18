import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

export default async function handleGameOverLoseState(responseCode, dungeon, user, socket) {
  console.log('handleGameOverLoseState Called');
  dungeon.dungeonStatus = DUNGEON_STATUS.GAME_OVER_LOSE;

  // 사망 메시지 전송 (버튼 포함)
  socket.write(
    createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '당신은 사망하였습니다...',
        typingAnimation: true,
        btns: [
          { msg: '확인', enable: true },
        ],
      },
    }),
  );
}
