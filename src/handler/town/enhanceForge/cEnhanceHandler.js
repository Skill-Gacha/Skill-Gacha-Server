// src/handler/town/enhanceForge/cEnhanceHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const cEnhanceHandler = async ({ socket, payload }) => {
    const user = sessionManager.getUserBySocket(socket);
  
    if (!user) {
      console.error('cEnhanceHandler: 사용자가 속한 세션을 찾을 수 없습니다.');
      return;
    }
};
