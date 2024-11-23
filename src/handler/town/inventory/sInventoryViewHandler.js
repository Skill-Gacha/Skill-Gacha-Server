import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import sessionManager from '#managers/sessionManager.js';
import { getGameAssets, getproductByid } from '../../../init/loadAssets.js';

export const sInventoryViewHandler = async ( socket, payload) => {
    const user = sessionManager.getSessionBySocket(socket);
    if (!user) {
        console.error('sInventoryViewHandler: 사용자가 속한 세션을 찾을 수 없습니다.');
        return;
    }

    try {
        // 응답 패킷 생성
        const inventoryResponse = createResponse(PacketType.S_InventoryViewResponse, {
            gold: gold,
            stone: stone,
            productList: inventory.productList.map(product => ({
                reserve: product.reserve,
                price,
            })),
        });

        // 사용자에게 응답 전송
        try {
            session.users.forEach((targetUser) => {
                if (targetUser.id === userId) {
                    targetUser.socket.write(inventoryResponse);
                }
            });
        } catch (error) {
            console.error('인벤토리 응답 패킷 전송 중 오류 발생:', error);
        }

    } catch (error) {
        console.error('인벤토리 조회 중 오류 발생:', error);
    }
};