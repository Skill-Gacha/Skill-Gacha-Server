// src/handler/town/enhanceForge/cEnhanceUiHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import logger from '../../../utils/log/logger.js';

export const cEnhanceUiHandler = async ({ socket }) => {
  try {
    const user = sessionManager.getUserBySocket(socket);
    if (!user) {
      logger.error('cEnhanceUiHandler: 사용자를 찾을 수 없습니다.');
    }

    // 사용자의 스킬 코드 목록 생성
    const skillCodes = user.userSkills.map((skill) => skill.id);

    const enhanceUiData = {
      gold: user.gold,
      stone: user.stone,
      skillCode: skillCodes,
    };

    // 응답 패킷 생성 및 전송
    socket.write(createResponse(PacketType.S_EnhanceUiResponse, enhanceUiData));
  } catch (error) {
    logger.error(`cEnhanceUiHandler 에러 발생: ${error.message}`);
  }
};
