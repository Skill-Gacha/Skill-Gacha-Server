// src/handler/dungeon/battleFlows/opponentAttackState.js

import {
  STATE_MESSAGE_WINDOW,
  STATE_GAME_OVER_LOSE,
  STATE_CHOOSE_ACTION, PVE_MODE, PVP_MODE,
} from '../../../constants/constants.js';
import messageWindowState from './messageWindowState.js';
import entityDeadState from './entityDeadState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';

const opponentAttackState = (responseCode, dungeon, user) => {
  console.log('opponentAttackState Called');

  if (dungeon.mode === PVE_MODE) {
    // 살아있는 모든 몬스터가 플레이어를 공격
    const aliveMonsters = dungeon.monsters.filter((monster) => monster.stat.hp > 0);

    for (const monster of aliveMonsters) {
      const damage = monster.stat.atk;
      user.stat.hp -= damage;
      if (user.stat.hp < 0) user.stat.hp = 0;

      // 공격 결과 전송
      user.socket.write(
        createResponse(PacketType.S_MonsterAction, {
          actionMonsterIdx: monster.monsterIdx,
          actionSet: {
            animCode: Math.floor(Math.random() * 2),
            effectCode: monster.effectCode,
          },
        }),
      );

      user.socket.write(createResponse(PacketType.S_SetPlayerHp, { hp: user.stat.hp }));

      if (user.stat.hp <= 0) {
        entityDeadState(responseCode, dungeon, user);
        return;
      }
    }

    dungeon.currentBattleState = STATE_MESSAGE_WINDOW;
    messageWindowState(0, dungeon, user);
  }
  else if (dungeon.mode === PVP_MODE) {
    // PVP 로직 구현
  }
};

export default opponentAttackState;
