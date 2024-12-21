// src/handler/pvp/cPlayerMatchHandler.js

import serviceLocator from '#locator/serviceLocator.js';
import QueueManager from '#managers/queueManager.js';
import SessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { createResponse } from '../../utils/response/createResponse.js';
import logger from '../../utils/log/logger.js';

export const cPlayerMatchCancelHandler = async ({ socket }) => {
  const sessionManager = serviceLocator.get(SessionManager);
  const queueManager = serviceLocator.get(QueueManager);
  const user = sessionManager.getUserBySocket(socket);

  if (!user) {
    logger.error('cPlayerMatchHandler: 유저가 존재하지 않습니다.');
    return;
  }

  try {
    await queueManager.removeMatchingQueue(user, 'pvp');
    user.socket.write(createResponse(PacketType.S_PvpPlayerMatchCancelResponse, { success: true }));
  } catch (error) {
    user.socket.write(
      createResponse(PacketType.S_PvpPlayerMatchCancelResponse, { success: false }),
    );
    throw new CustomError(ErrorCodes.PVP_MATCH_CANCEL_FAILED, error);
  }
};
