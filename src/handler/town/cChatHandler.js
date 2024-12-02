// src/handler/town/cChatHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '#managers/sessionManager.js';
import logger from '../../utils/log/logger.js';

export const cChatHandler = async ({ socket, payload }) => {
  try {
    const { chatMsg } = payload;

    if (typeof chatMsg !== 'string' || chatMsg.trim() === '') {
      logger.error('cChatHandler: 유효하지 않은 채팅');
    }

    const user = sessionManager.getUserBySocket(socket);
    if (!user) {
      logger.error('cChatHandler: 유저를 찾을 수 없습니다.');
    }

    const town = sessionManager.getTown();
    if (!town) {
      logger.error('cChatHandler: 타운 세션을 찾을 수 없습니다.');
    }

    const chatPayload = createResponse(PacketType.S_Chat, {
      playerId: user.id,
      chatMsg: chatMsg,
    });

    // 타운 내 모든 유저에게 패킷 전송
    broadcastToTown(town, chatPayload);
  } catch (error) {
    logger.error(`cChatHandler 에러 발생: ${error.message}`);
    // 필요한 경우 사용자에게 에러 응답 전송
  }
};

const broadcastToTown = (town, payload) => {
  town.users.forEach((targetUser) => {
    try {
      targetUser.socket.write(payload);
    } catch (error) {
      logger.error(`cChatHandler: S_Chat 패킷 전송 중 오류 발생: ${targetUser.id}: ${error.message}`);
    }
  });
};
