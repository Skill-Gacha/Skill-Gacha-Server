// src/handler/town/store/cBuyItemHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { updateItemCountInRedis } from '../../../db/redis/itemService.js';
import { getProductById } from '../../../init/loadAssets.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { updateUserResource } from '../../../db/user/userDb.js';
import logger from '../../../utils/log/logger.js';

export const cBuyItemHandler = async ({ socket, payload }) => {
  try {
    const { itemId } = payload;

    const user = sessionManager.getUserBySocket(socket);
    if (!user) {
      logger.error('cBuyItemHandler: 사용자 정보를 찾을 수 없습니다.');
    }

    const product = getProductById(itemId);
    if (!product) {
      logger.error('cBuyItemHandler: 유효한 아이템 정보가 아닙니다.');
    }

    // 자원 및 아이템 확인
    const userItem = user.items.find((item) => item.itemId === product.id);

    if (user.gold < product.price) {
      return sendBuyItemResponse(socket, false);
    }

    if (userItem && userItem.count >= 3) {
      return sendBuyItemResponse(socket, false);
    }

    // 자원 및 아이템 업데이트
    user.reduceResource(product.price, 0);
    await updateUserResource(user.nickname, user.gold, user.stone);

    if (userItem) {
      userItem.count += 1;
    } else {
      user.items.push({ itemId: product.id, count: 1 });
    }

    await updateItemCountInRedis(user.nickname, itemId, 1);

    // 응답 전송
    sendBuyItemResponse(socket, true, itemId, user.gold, userItem ? userItem.count : 1);
  } catch (error) {
    logger.error(`cBuyItemHandler 에러 발생: ${error.message}`);
    sendBuyItemResponse(socket, false);
  }
};

const sendBuyItemResponse = (socket, success, itemId = null, gold = null, reserve = null) => {
  const responseData = { success };
  if (success) {
    responseData.itemId = itemId;
    responseData.changeGold = gold;
    responseData.reserve = reserve;
  }
  socket.write(createResponse(PacketType.S_BuyItemResponse, responseData));
};
