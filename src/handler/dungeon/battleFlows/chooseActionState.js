// src/handler/dungeon/battleFlows/chooseActionState.js

import {
  STATE_CHOOSE_TARGET,
  STATE_ITEM_SELECT,
  STATE_CHOOSE_SKILL_TYPE,
  PVE_MODE, PVP_MODE,
} from '../../../constants/constants.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';
import chooseTargetState from './chooseTargetState.js';

const chooseActionState = (responseCode, dungeon, user) => {
  console.log('chooseActionState Called');
  console.log('chooseActionState Response Code:', responseCode);
  
  const buttons = [];

  switch (responseCode) {
    case 1:
      if (dungeon.mode === PVE_MODE) {   // PvE
        // 공격 대상 선택
        const buttons = [];
        for (let i = 0; i < dungeon.monsters.length; i++) {
          const monster = dungeon.monsters[i];
          buttons.push({ msg: `${monster.monsterName}`, enable: monster.stat.hp > 0 });
        }
        const attackBattleLog = {
          msg: '공격할 몬스터를 선택하세요!',
          typingAnimation: false,
          btns: buttons,
        };

        const attackResponse = createResponse(PacketType.S_BattleLog, {
          battleLog: attackBattleLog,
        });
        user.socket.write(attackResponse);

        dungeon.currentBattleState = STATE_CHOOSE_TARGET;
      } else if (dungeon.mode === PVP_MODE) {    // PvP
        // 상대방 플레이어를 대상으로 설정하고 공격 진행
        // 구현 필요
      }
      break;
    case 2:
      // 아이템 사용 선택
      // dungeon.currentBattleState = STATE_ITEM_SELECT;
      // selectItemState(responseCode, dungeon, user);
      break;
    case 3:
      // 스킬 사용 선택
      // dungeon.currentBattleState = STATE_CHOOSE_SKILL_TYPE;
      // chooseSkillTypeState(responseCode, dungeon, user);
      break;
    default:
      // 잘못된 입력 처리
      user.socket.write(
        createResponse(PacketType.S_BattleLog, {
          battleLog: {
            msg: '비정상적인 선택입니다.',
            typingAnimation: true,
          },
        }),
      );
      break;
  }
};

export default chooseActionState;
