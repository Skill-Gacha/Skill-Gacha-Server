// src/handler/town/inventory/cInventoryViewHandler.js

import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { getProductData } from '../../../init/loadAssets.js';
import logger from '../../../utils/log/logger.js';
import serviceLocator from '#locator/serviceLocator.js';
import SessionManager from '#managers/sessionManager.js';

export const cInventoryViewHandler = async ({ socket }) => {
  try {
    const sessionManager = serviceLocator.get(SessionManager);
    const user = sessionManager.getUserBySocket(socket);
    if (!user) {
      logger.error('cInventoryViewHandler: 사용자를 찾을 수 없습니다.');
    }

    // 모든 제품 데이터 가져오기
    const allProducts = getProductData();

    // 제품 리스트 생성
    const productList = allProducts.map((product) => {
      const userItem = user.inventory.items.find((item) => item.itemId === product.id);
      return {
        reserve: userItem ? userItem.count : 0,
      };
    });

    // 응답 패킷 생성 및 전송
    const inventoryResponse = createResponse(PacketType.S_InventoryViewResponse, {
      gold: user.gold,
      stone: user.stone,
      productList,
    });

    socket.write(inventoryResponse);
  } catch (error) {
    logger.error(`cInventoryViewHandler: 인벤토리 조회 중 오류 발생: ${error.message}`);
  }
};
