// src/handler/dungeon/transitions/switchToConfirmState.js

import { DUNGEON_STATUS } from '../../../constants/battle.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';

export default async function switchToConfirmState(dungeon, user, socket, message) {
  dungeon.dungeonStatus = DUNGEON_STATUS.CONFIRM;

  const btns = [
    { msg: '예', enable: true },
    { msg: '아니오', enable: true },
  ];

  const battleLog = {
    msg: message,
    typingAnimation: false,
    btns,
  };

  socket.write(createResponse(PacketType.S_BattleLog, { battleLog }));
}
