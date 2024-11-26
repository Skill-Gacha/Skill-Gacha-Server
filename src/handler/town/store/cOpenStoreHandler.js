// src/handler/town/cOpenStoreHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { getProductData } from '../../../init/loadAssets.js';
import { createResponse } from '../../../utils/response/createResponse.js';

export const cOpenStoreHandler = async ({ socket }) => {
  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('cOpenStoreHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  const products = getProductData();

  const productList = products.map((product) => {
    const userItem = user.items.find((item) => item.itemId === product.id);
    return {
      reserve: userItem ? userItem.count : 0,
      price: product.price,
    };
  });

  const openStoreData = {
    gold: user.gold,
    stone: user.stone,
    productList,
  };

  const openStoreResponse = createResponse(PacketType.S_OpenStoreResponse, openStoreData);

  try {
    user.socket.write(openStoreResponse);
  } catch (error) {
    console.error('cOpenStoreHandler: 패킷 전송 중 오류 발생:', error);
  }
};
