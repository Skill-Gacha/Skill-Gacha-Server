// src/handler/dungeon/transitions/switchToUseItemState.js

export default async function switchToUseItemState(dungeon, user, socket) {
  // dungeon.dungeonStatus = DUNGEON_STATUS.USE_ITEM;
  //
  // // 아이템 선택 화면 전송
  // const itemList = user.inventory.getItems().map(item => ({
  //   msg: item.name,
  //   enable: true,
  //   itemId: item.id, // 아이템 식별을 위한 추가 정보
  // }));
  //
  // const battleLog = {
  //   msg: '사용할 아이템을 선택해주세요.',
  //   typingAnimation: false,
  //   btns: itemList,
  // };
  //
  // const response = createResponse(PacketType.S_BattleLog, { battleLog });
  // socket.write(response);
}
