import { PacketType } from "../../constants/header.js";
import { createResponse } from "../../utils/response/createResponse.js";

export const sMonsterActionHandler = async (dungeon, user) => {
    const monsters = dungeon.monsters
    const btns = []; // 배틀이 종료되고 생성되는 버튼들

    // 던전 세션 안에 몬스터 배열에서 인덱스를 돌아가면서 내가 설정해준다
    for (const monster of monsters) {
        if (monster.monsterHp <= 0) {
            btns.push({ msg: monster.monsterName, enable: false });
            continue;
        }
        const actionSet = {
            animCode: Math.floor(Math.random() * 2), // 0이랑 1이 몬스터 공격 모션
            effectCode: monster.effectCode,
        };

        user.updateUserHp(monster.atk)

        const acctionBattleLog = {
            msg: `몬스터에게 공격받아 ${monster.atk}만큼 체력이 감소하였습니다.`,
            typingAnimation: true,
        }

        try {
            user.socket.write(createResponse(PacketType.S_MonsterAction, { actionMonsterIdx: monster.monsterIdx, actionSet }));
            user.socket.write(createResponse(PacketType.S_SetPlayerHp, { hp: user.stat.hp }));
            user.socket.write(createResponse(PacketType.S_BattleLog, acctionBattleLog));
            btns.push({ msg: monster.monsterName, enable: true });

            // 플레이어가 죽었다면 사망 메시지 전송 및 던전 종료
            if (user.stat.hp === 0) {
                // 사망 모션 패킷 전달
                user.socket.write(createResponse(PacketType.S_PlayerAction, {
                    targetMonsterIdx: null,
                    actionSet: {
                        animCode: 1,
                        effectCode: null
                    }
                }))
                // 사망 스크린 표시
                user.socket.write(createResponse(PacketType.S_ScreenText, {
                    msg: '캐릭터가 사망하였습니다.',
                    typingAnimation: true
                }));
                // 던전 종료
                user.socket.write(createResponse(PacketType.S_LeaveDungeon, {}));
                return;
            }
        } catch (error) {
            console.error('S_MonsterAction 패킷 전송 중 오류 발생:', error);
            return;
        }
    };

    // 몬스터의 공격이 모두 끝난 후 배틀로그
    const endBattleLog = {
        msg: '몬스터를 선택하여 공격을 진행해주세요',
        typingAnimation: true,
        btns,
    }
    user.socket.write(createResponse(PacketType.S_BattleLog, endBattleLog));
}