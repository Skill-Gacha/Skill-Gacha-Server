// handler/dungeon/transitions/switchToTargetState.js

import { DUNGEON_STATUS } from '../../../constants/battle.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';

export default async function switchToTargetState(dungeon, user, socket) {
  console.log('switchToTargetState Called');
  dungeon.dungeonStatus = DUNGEON_STATUS.TARGET;

  const btns = dungeon.monsters.map((monster) => ({
    msg: monster.monsterName,
    enable: monster.monsterHp > 0,
    code: monster.monsterIdx,
  }));

  const battleLog = {
    msg: '공격할 대상을 선택해주세요.',
    typingAnimation: false,
    btns,
  };

  socket.write(createResponse(PacketType.S_BattleLog, { battleLog }));
}
