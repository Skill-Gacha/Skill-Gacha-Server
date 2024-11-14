import { PacketType } from "../../constants/header.js";
import { createResponse } from "../../utils/response/createResponse.js";
import { getUserBySocket } from "../../sessions/userSession.js";
import { townSession } from "../../sessions/sessions.js";

export const sAnimationHandler = async ({ socket, payload }) => {
    const animCode = payload.aniCode;
    const user = await getUserBySocket(socket);
    if (!user) {
        console.error('유저를 찾을 수 없습니다.');
        return;
    }
    // 애니메이션 업데이트
    user.updateAnimCode(animCode);
    const data = {
        playerId: user.id,
        animCode: user.aniCode,
    };
    const animationPayload = createResponse(PacketType.S_Animation, data)
    if (!townSession) {
        console.error('타운세션을 찾을 수 없습니다.')
    }
    // 타운 내 자신을 제외한 모든 유저에게 패킷 전송
    townSession.users.forEach((targetUser) => {
        if (targetUser.id !== user.id) {
            try {
                targetUser.socket.write(animationPayload);
            } catch (error) {
                console.error('Smove 패킷 전송중 오류 발생', error)
            }
        }
    });
}