// src/handler/town/cMoveHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { getProductData } from '../../../init/loadAssets.js';
import { createResponse } from '../../../utils/response/createResponse.js';

export const cOpenStoreHandler = async ({ socket, payload }) => {
  // 소켓을 통해 사용자 정보 가져오기
  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('C_Move: 사용자 정보를 찾을 수 없습니다.');
    return;
  }

  // 모든 아이템 데이터 불러오기
  const products = getProductData();

  // 유저가 각 아이템 몇개 가지고 있는지
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
    console.error('S_OpenStoreResponse 패킷 전송중 오류 발생', error);
  }
};
