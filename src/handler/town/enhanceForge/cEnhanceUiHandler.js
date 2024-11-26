// src/handler/town/enhanceForge/cEnhanceUiHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const cEnhanceUiHandler = async ({ socket, payload }) => {
    const user = sessionManager.getUserBySocket(socket);
  
    if (!user) {
      console.error('cEnhanceUiHandler: 사용자가 속한 세션을 찾을 수 없습니다.');
      return;
    }
};
