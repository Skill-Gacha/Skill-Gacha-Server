import { PacketType } from "../../constants/header.js";
import { createResponse } from "../../utils/response/createResponse.js";

export const sMonsterActionHandler = async (dungeon, user) => {
    const monsters = dungeon.monsters

    // 던전 세션 안에 몬스터 배열에서 인덱스를 돌아가면서 내가 설정해준다
    monsters.forEach((monster) => {
        const actionSet = {
            // 0이랑 1이 몬스터 공격 모션
            animCode: Math.floor(Math.random() * 2),
            effectCode: monster.effectCode,
        };

        const damage = monster.atk;
        user.updateUserHp(damage)

        // todo 배틀로그(해야할 것)

        // const battleLog = {
        //     msg: `몬스터에게 공격받아 ${damage}만큼 체력이 감소하였습니다.`,
        //     typingAnimation: true,
        //     btns: [
        //         { msg: "계속", enable: true },
        //         { msg: "도망가기", enable: true }
        //     ]
        // }
        // sendResponse(user.socket, PacketType.S_BattleLog, { battleLog });

        try {
            user.socket.write(createResponse(PacketType.S_MonsterAction, { actionMonsterIdx: monster.monsterIdx, actionSet }));
            user.socket.write(createResponse(PacketType.S_SetPlayerHp, { hp: user.stat.hp }));

            // 플레이어가 죽었다면 사망 메시지 전송 및 던전 종료
            if (user.stat.hp === 0) {
                // todo 사망 모션 패킷 전달
                // user.socket.write(createResponse(PacketType.S_PlayerAction, ))
                // 사망 스크린 표시
                user.socket.write(createResponse(PacketType.S_ScreenText, {
                    msg: '캐릭터가 사망하였습니다.',
                    typingAnimation: true
                }));
                // 던전 종료
                user.socket.write(createResponse(PacketType.S_LeaveDungeon, {}));
            }
        } catch (error) {
            console.error('S_MonsterAction 패킷 전송 중 오류 발생:', error);
        }
    });
}