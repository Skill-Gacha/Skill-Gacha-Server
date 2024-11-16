// src/handler/dungeon/battleFlows/messageWindowStatus.js

import {
  STATE_CHOOSE_ACTION,
  STATE_GAME_OVER_WIN,
  STATE_GAME_OVER_LOSE,
  STATE_MESSAGE_WINDOW,
} from '../../../constants/constants.js';
import gameOverWinState from './gameOverWinState.js';
import gameOverLoseState from './gameOverLoseState.js';
import chooseActionState from './chooseActionState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';

const messageWindowState = async (responseCode, dungeon, user) => {
  console.log('messageWindowState Called');
  if (responseCode === 0) {
    const buttons = [];

    buttons.push({ msg: '일반 공격', enable: true });
    buttons.push({ msg: '스킬 사용', enable: false});
    buttons.push({ msg: '도망치기', enable: false });
    buttons.push({ msg: '아이템 사용', enable: false });

    const battleLog = {
      msg: '무엇을 할까요?',
      typingAnimation: false,
      btns: buttons,
    };

    if (dungeon.currentBattleState === STATE_MESSAGE_WINDOW) {
      const responseScreenDone = createResponse(PacketType.S_ScreenDone, {});
      user.socket.write(responseScreenDone);
    }

    const responseBattleLog = createResponse(PacketType.S_BattleLog, { battleLog });
    user.socket.write(responseBattleLog);
  }
  
  dungeon.currentBattleState = STATE_CHOOSE_ACTION;
};

export default messageWindowState;
