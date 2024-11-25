// src/handler/town/cMoveHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { getProductById } from '../../init/loadAssets.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const cBuyItemHandler = async ({ socket, payload }) => {
  const { itemId } = payload;
  console.log('itemId : ', itemId);
  // 소켓을 통해 사용자 정보 가져오기
  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('C_Move: 사용자 정보를 찾을 수 없습니다.');
    return;
  }

  const product = getProductById(itemId);

  // 돈이 충분한지 확인 해서 조건문으로 실행해야 됨
  if (user.gold < product.price) {
    user.socket.write(createResponse(PacketType.S_BuyItemResponse, { success: false }));
    return;
  }

  // 유저 아이템량 증가시켜주기 (이미 존재하는지 안 하는지 확인)
  let reserve;
  const userItem = user.items.find((item) => item.itemId === product.id);
  userItem.count += 1;
  reserve = userItem.count;

  // 아이템 카운트가 3 이상이면 구매 불가
  if (userItem.count >= 3) {
    user.socket.write(
      createResponse(PacketType.S_BuyItemResponse, {
        success: false,
        message: '아이템을 3개 이상 구매할 수 없습니다.',
      }),
    );
    return;
  }

  // 유저 골드 감소시키기
  user.reduceGold(product.price);

  try {
    user.socket.write(
      createResponse(PacketType.S_BuyItemResponse, {
        success: true,
        itemId: payload,
        changeGold: user.gold,
        reserve,
      }),
    );
  } catch (error) {
    console.error('S_BuyItemResponse 패킷 전송중 오류 발생', error);
  }
};
