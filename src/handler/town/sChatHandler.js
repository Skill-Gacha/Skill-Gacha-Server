import { PacketType } from "../../constants/header.js";
import { createResponse } from "../../utils/response/createResponse.js";
import { getUserBySocket } from "../../sessions/userSession.js";
import { townSession } from "../../sessions/sessions.js";

export const sChatHandler = async ({ socket, payload }) => {
    const { playerId, senderName, chatMsg } = payload;

    const user = await getUserBySocket(socket);
    if (!user) {
        console.error('유저를 찾을 수 없습니다.');
        return;
    }

    const data = {
        playerId: playerId,
        chatMsg: chatMsg,
    };

    const chatPayload = createResponse(PacketType.S_Chat, data)
    if (!townSession) {
        console.error('타운세션을 찾을 수 없습니다.')
        return;
    }
    // 타운 내 자신을 제외한 모든 유저에게 패킷 전송
    townSession.users.forEach((targetUser) => {
        if (targetUser.id !== user.id) {
            try {
                targetUser.socket.write(chatPayload);
            } catch (error) {
                console.error('S_Chat 패킷 전송중 오류 발생', error)
            }
        }
    });
}