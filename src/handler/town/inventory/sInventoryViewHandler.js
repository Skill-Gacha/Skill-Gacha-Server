import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import sessionManager from '#managers/sessionManager.js';
import { getProductData } from '../../../init/loadAssets.js';

export const sInventoryViewHandler = async ({ socket, payload }) => {
  console.log('요청 확인?');
  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('sInventoryViewHandler: 사용자가 속한 세션을 찾을 수 없습니다.');
    return;
  }
  //모든 제품 데이터 가져오기
  const products = getProductData(); //전체 아이템들 5종
  const inventory = user.getInventory();

  // 제품 리스트 생성
  const productList = products.map((product) => {
    const userItem = user.items.find((item) => item.itemId === product.id);
    return {
      reserve: userItem ? userItem.count : 0,
    };
  });

  try {
    // 응답 패킷 생성
    const inventoryResponse = createResponse(PacketType.S_InventoryViewResponse, {
      gold: inventory.gold, // 보유 골드
      stone: inventory.stone, // 보유 강화석
      productList, // 제품 리스트
    });
    console.log('인벤토리 데이터?', productList);
    // 사용자에게 응답 전송
    socket.write(inventoryResponse);
  } catch (error) {
    console.error('인벤토리 조회 중 오류 발생:', error);
    // 필요한 경우 오류 응답 전송
  }
};
