// src/handler/town/store/cOpenStoreHandler.js

import { PacketType } from '../../../constants/header.js';
import { getProductData } from '../../../init/loadAssets.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import logger from '../../../utils/log/logger.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';

export const cOpenStoreHandler = async ({ socket }) => {
  try {
    const sessionManager = serviceLocator.get(SessionManager);
    const user = sessionManager.getUserBySocket(socket);
    if (!user) {
      logger.error('cOpenStoreHandler: 유저를 찾을 수 없습니다.');
    }

    const products = getProductData();

    const productList = products.map((product) => {
      const userItem = user.inventory.items.find((item) => item.itemId === product.id);
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

    user.socket.write(openStoreResponse);
  } catch (error) {
    logger.error(`cOpenStoreHandler 에러 발생: ${error.message}`);
  }
};
