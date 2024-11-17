// src/handler/dungeon/transitions/switchToActionState.js

import { DUNGEON_STATUS } from '../../../constants/battle.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';

export default async function switchToActionState(dungeon, socket) {
  console.log('switchToActionState Called');
  dungeon.dungeonStatus = DUNGEON_STATUS.ACTION;

  const btns = [
    { msg: '공격', enable: true },
    { msg: '스킬 사용', enable: false },
    { msg: '아이템 사용', enable: false },
    { msg: '도망치기', enable: true },
  ];

  const battleLog = {
    msg: '행동을 선택해주세요.',
    typingAnimation: false,
    btns,
  };

  const response = createResponse(PacketType.S_BattleLog, { battleLog });
  socket.write(response);
}
