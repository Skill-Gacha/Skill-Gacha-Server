// src/handler/town/cBuyItemHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { getProductById } from '../../init/loadAssets.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const cBuyItemHandler = async ({ socket, payload }) => {
  const { itemId } = payload;

  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('cBuyItemHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  const product = getProductById(itemId);
  if (!product) {
    console.error(`cBuyItemHandler: 존재하지 않는 아이템 ID (${itemId})`);
    return;
  }

  if (user.gold < product.price) {
    user.socket.write(createResponse(PacketType.S_BuyItemResponse, { success: false }));
    return;
  }

  let reserve;
  const userItem = user.items.find((item) => item.itemId === product.id);
  if (userItem.count >= 3) {
    user.socket.write(
      createResponse(PacketType.S_BuyItemResponse, {
        success: false,
        message: '아이템을 3개 이상 구매할 수 없습니다.',
      })
    );
    return;
  }

  userItem.count += 1;
  reserve = userItem.count;

  user.reduceGold(product.price);

  try {
    user.socket.write(
      createResponse(PacketType.S_BuyItemResponse, {
        success: true,
        itemId: itemId,
        changeGold: user.gold,
        reserve,
      })
    );
  } catch (error) {
    console.error('cBuyItemHandler: S_BuyItemResponse 패킷 전송 중 오류 발생:', error);
  }
};
