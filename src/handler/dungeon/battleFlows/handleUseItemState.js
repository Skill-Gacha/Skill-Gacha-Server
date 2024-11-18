// src/handler/dungeon/battleFlows/handleUseItemState.js

export default async function handleUseItemState(responseCode, dungeon, user, socket) {
  // const selectedItem = user.inventory.getItemById(responseCode);
  //
  // if (selectedItem) {
  //   // 아이템 사용 로직 처리
  //   user.useItem(selectedItem);
  //
  //   // 아이템 사용 결과 메시지 전송
  //   socket.write(
  //     createResponse(PacketType.S_BattleLog, {
  //       battleLog: {
  //         msg: `${selectedItem.name}을(를) 사용하였습니다.`,
  //         typingAnimation: false,
  //         btns: [],
  //       },
  //     }),
  //   );
  //
  //   // 행동 선택 상태로 돌아감
  //   await switchToActionState(dungeon, socket);
  // } else {
  //   // 유효하지 않은 아이템 선택 처리
  //   const invalidResponse = createResponse(PacketType.S_BattleLog, {
  //     battleLog: {
  //       msg: '유효하지 않은 아이템입니다. 다시 선택해주세요.',
  //       typingAnimation: false,
  //       btns: [],
  //     },
  //   });
  //   socket.write(invalidResponse);
  // }
}
