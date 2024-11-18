import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

export default async function handleGameOverWinState(responseCode, dungeon, user, socket) {
  console.log('handleGameOverWinState Called');
  dungeon.dungeonStatus = DUNGEON_STATUS.GAME_OVER_WIN;

  // 던전 클리어 메시지 전송 (버튼 포함)
  socket.write(
    createResponse(PacketType.S_ScreenText, {
      screenText: {
        msg: '던전을 클리어 하였습니다!',
        typingAnimation: true,
        btns: [
          { msg: '확인', enable: true },
        ],
      },
    }),
  );

  // 보상 처리
  // TODO: 보상 로직 구현
}
