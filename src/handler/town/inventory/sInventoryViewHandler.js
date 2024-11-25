import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import sessionManager from '#managers/sessionManager.js';
import { getProductData } from '../../../init/loadAssets.js';

export const sInventoryViewHandler = async (socket, payload) => {
    const user = sessionManager.getSessionBySocket(socket);
    if (!user) {
        console.error('sInventoryViewHandler: 사용자가 속한 세션을 찾을 수 없습니다.');
        return;
    }
    //모든 제품 데이터 가져오기
    const allProducts = getProductData();
    const inventory = user.getInventory();

    try {
        // 제품 리스트 생성
        const productList = allProducts.map(product => {
            const userItem = inventory.productList.find(item => item.id === product.id);  // 사용자 인벤토리에서 제품 조회
            return {
                reserve: userItem ? userItem.count : 0, // 보유 수량
                price: product.price, // 제품 가격
            };
        });

        // 응답 패킷 생성
        const inventoryResponse = createResponse(PacketType.S_InventoryViewResponse, {
            playerId: user.id,
            gold: inventory.gold, // 보유 골드
            stone: inventory.stone, // 보유 강화석
            productList, // 제품 리스트
        });

        // 사용자에게 응답 전송
        socket.write(inventoryResponse);

    } catch (error) {
        console.error('인벤토리 조회 중 오류 발생:', error);
        // 필요한 경우 오류 응답 전송
    }

};