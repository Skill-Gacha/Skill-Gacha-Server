// src/handler/dungeon/battleFlows/handleConfirmState.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import switchToActionState from '../transition/switchToActionState.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';

export default async function handleConfirmState(responseCode, dungeon, user, socket) {
  const confirmType = dungeon.confirmType || 'DEFAULT';

  switch (confirmType) {
    case 'FLEE':
      await handleFleeResponse(responseCode, dungeon, user, socket);
      break;

    case 'USE_ITEM':
      // await handleUseItemResponse(responseCode, dungeon, user, socket);
      break;

    // 필요한 경우 다른 confirmType 추가
    default:
      // 유효하지 않은 요청 처리
      const invalidResponse = createResponse(PacketType.S_BattleLog, {
        battleLog: {
          msg: '잘못된 요청입니다.',
          typingAnimation: false,
          btns: [],
        },
      });
      socket.write(invalidResponse);
      break;
  }
}

async function handleFleeResponse(responseCode, dungeon, user, socket) {
  if (responseCode === 1) {
    // 플레이어가 '예'를 선택한 경우, 도망쳤다는 메시지를 보냄
    socket.write(
      createResponse(PacketType.S_ScreenText, {
        screenText: {
          msg: '전투에서 도망쳤습니다.',
          typingAnimation: true,
          btns: [
            { msg: '확인', enable: true },
          ],
        },
      }),
    );

    // 던전 상태를 FLEE_MESSAGE로 변경
    dungeon.dungeonStatus = DUNGEON_STATUS.FLEE_MESSAGE;

    console.log(`유저 ${user.id}가 던전 ${dungeon.dungeonCode}에서 도망쳤습니다.`);
  } else if (responseCode === 2) {
    // 플레이어가 '아니오'를 선택한 경우, 행동 선택 상태로 돌아감
    await switchToActionState(dungeon, socket);
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
