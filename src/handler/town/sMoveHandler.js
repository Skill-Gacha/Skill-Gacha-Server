import { PacketType } from "../../constants/header.js";
import { createResponse } from "../../utils/response/createResponse.js";
import { getUserBySocket } from "../../sessions/userSession.js";
import { townSession } from "../../sessions/sessions.js";

export const sMoveHandler = async ({ socket, payload }) => {
    const { posX, posY, posZ, rot } = payload;

    const user = await getUserBySocket(socket);
    if (!user) {
        console.error('유저를 찾을 수 없습니다.');
        return;
    }

    // 위치 업데이트
    user.position.updatePosition(posX, posY, posZ, rot);

    const data = {
        playerId: user.id,
        transform: user.position,
    };

    const movePayload = createResponse(PacketType.S_Move, data)

    if (!townSession) {
        console.error('타운세션을 찾을 수 없습니다.')
    }

    // 타운 내 자신을 제외한 모든 유저에게 패킷 전송
    townSession.users.forEach((targetUser) => {
        if (targetUser.id !== user.id) {
            try {
                targetUser.socket.write(movePayload);
            } catch (error) {
                console.error('Smove 패킷 전송중 오류 발생', error)
            }
        }
    });
}

