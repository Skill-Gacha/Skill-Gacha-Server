// src/handlers/cChatHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '../../managers/SessionManager.js';

export const cChatHandler = async ({ socket, payload }) => {
  const { playerId, senderName, chatMsg } = payload;

  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('유저를 찾을 수 없습니다.');
    return;
  }

  const chatPayload = createResponse(PacketType.S_Chat, {
    playerId: user.id,
    chatMsg: chatMsg,
  });

  const town = sessionManager.getTown();
  if (!town) {
    console.error('타운 세션을 찾을 수 없습니다.');
    return;
  }

  // 타운 내 모든 유저에게 패킷 전송 (자신을 제외하려면 조건 추가)
  town.users.forEach((targetUser) => {
    try {
      targetUser.socket.write(chatPayload);
    } catch (error) {
      console.error('S_Chat 패킷 전송중 오류 발생', error);
    }
  });
};
