// src/handler/dungeon/battleFlows/handleActionState.js

import switchToTargetState from '../transition/switchToTargetState.js';
import switchToConfirmState from '../transition/switchToConfirmState.js';
import switchToActionState from '../transition/switchToActionState.js';
// import switchToItemSelectionState from '../transition/switchToItemSelectionState.js';
// import switchToSkillSelectionState from '../transition/switchToSkillSelectionState.js';

export default async function handleActionState(responseCode, dungeon, user, socket) {
  console.log('handleActionState Called');
  await switchToActionState(dungeon, socket);
  switch (responseCode) {
    case 1: // 공격 선택
      await switchToTargetState(dungeon, user, socket);
      break;
    // case 2: // 스킬 사용
    //   await switchToSkillSelectionState(dungeon, user, socket);
    //   break;
    // case 3: // 아이템 사용
    //   await switchToItemSelectionState(dungeon, user, socket);
    //   break;
    case 4: // 도망치기
      await switchToConfirmState(dungeon, user, socket, '정말 도망치시겠습니까?');
      break;
    default:
      // 유효하지 않은 입력 처리
      // const invalidResponse = createResponse(PacketType.S_BattleLog, {
      //   battleLog: {
      //     msg: '잘못된 선택입니다. 다시 선택해주세요.',
      //     typingAnimation: false,
      //     btns: [],
      //   },
      // });
      // socket.write(invalidResponse);
      break;
  }
}
