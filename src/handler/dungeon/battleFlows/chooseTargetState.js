// src/handler/dungeon/battleFlows/chooseTargetState.js

import {
  PVE_MODE, PVP_MODE,
  STATE_OPPONENT_ATTACK,
  STATE_OPPONENT_DEAD,
  STATE_PLAYER_ATTACK,
} from '../../../constants/constants.js';
import playerAttackState from './playerAttackState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';
import entityDeadState from './entityDeadState.js';
import opponentAttackState from './opponentAttackState.js';

const chooseTargetState = (responseCode, dungeon, user) => {
  console.log('chooseTargetState Called');
  const btns = [{ msg: '다음', enable: true }];

  const targetMonster = dungeon.monsters.find((monster) => monster.monsterIdx === responseCode - 1 && monster.stat.hp > 0);
  let msg = `${targetMonster.monsterName} 공격!`

  console.log(targetMonster);
  if (targetMonster) {
    dungeon.target = targetMonster;
    dungeon.currentBattleState = STATE_PLAYER_ATTACK;

    const battleLog = {
      msg,
      typingAnimation: true,
      btns,
    };
    const responseBattleLog = createResponse(PacketType.S_BattleLog, { battleLog });
    user.socket.write(responseBattleLog);
    
    // ====

    const target = dungeon.target;
    const damage = user.stat.atk;

    target.stat.hp -= damage;
    if (target.stat.hp < 0) target.stat.hp = 0;

    if (dungeon.mode === PVE_MODE) {
      // 몬스터 공격
      user.socket.write(
        createResponse(PacketType.S_PlayerAction, {
          targetMonsterIdx: target.monsterIdx,
          actionSet: {
            animCode: 0,
            effectCode: 3001,
          },
        }),
      );

      for (let monster of dungeon.monsters) {        
        const setMonsterHpResponse = createResponse(PacketType.S_SetMonsterHp, {
          monsterIdx: monster.monsterIdx,
          hp: monster.stat.hp,
        })
        user.socket.write(setMonsterHpResponse);
      }
      
      dungeon.currentBattleState = STATE_PLAYER_ATTACK;
    } else if (dungeon.mode === PVP_MODE) {
      // PvP 로직 구현 필요
    }
  } else {
    user.socket.write(
      createResponse(PacketType.S_BattleLog, {
        battleLog: {
          msg: '유효하지 않은 몬스터입니다. 다시 선택해주세요.',
          typingAnimation: true,
        },
      }),
    );
  }
};

export default chooseTargetState;
