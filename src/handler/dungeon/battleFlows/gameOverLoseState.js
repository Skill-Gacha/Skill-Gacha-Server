// src/handler/dungeon/battleFlows/gameOverLoseState.js

import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';
import { STATE_GAME_OVER_LOSE } from '../../../constants/constants.js';

const gameOverLoseState = (responseCode, dungeon, user) => {
  console.log('gameOverLoseState Called');
  user.socket.write(
    createResponse(PacketType.S_ScreenText, { screenText: {
      msg: '전투에서 패배하였습니다.',
      typingAnimation: true,
    }}),
  );
  
  
  user.socket.write(createResponse(PacketType.S_LeaveDungeon, {}));
  
  
  // 패배 DB 기록
  return;
};

export default gameOverLoseState;
