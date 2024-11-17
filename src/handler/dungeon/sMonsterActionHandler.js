// src/handlers/sMonsterActionHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '../../managers/SessionManager.js';
import { delay } from './delay.js';

export const sMonsterActionHandler = async (user, dungeon) => {
    if (!user || !dungeon) {
        console.error('sMonsterActionHandler: 유저 또는 던전 객체가 없습니다.');
        return;
    }

    const monsters = dungeon.monsters;
    const btns = []; // 배틀이 종료되고 생성되는 버튼들

    for (const monster of monsters) {
        if (monster.monsterHp <= 0) {
            btns.push({ msg: monster.monsterName, enable: false });
            continue;
        }

        const actionSet = {
            animCode: Math.floor(Math.random() * 2), // 0이랑 1이 몬스터 공격 모션
            effectCode: monster.effectCode,
        };

        user.updateUserHp(monster.atk);

        const actionBattleLog = {
            battleLog: {
                msg: `${monster.monsterName}에게 공격받아 ${monster.atk}만큼 체력이 감소하였습니다.`,
                typingAnimation: true,
            },
        };

        try {
            user.socket.write(createResponse(PacketType.S_BattleLog, actionBattleLog));
            user.socket.write(
              createResponse(PacketType.S_MonsterAction, {
                  actionMonsterIdx: monster.monsterIdx,
                  actionSet,
              }),
            );
            user.socket.write(createResponse(PacketType.S_SetPlayerHp, { hp: user.stat.hp }));
            btns.push({ msg: monster.monsterName, enable: true });

            // 플레이어가 죽었다면 사망 메시지 전송 및 던전 종료
            if (user.stat.hp === 0) {
                
                user.socket.write(
                  createResponse(PacketType.S_ScreenText, {
                      screenText: {
                          msg: '캐릭터가 사망하였습니다.',
                          typingAnimation: true,
                      },
                  }),
                );

                // 던전 세션에서 사용자 제거 및 퇴장 응답
                sessionManager.removeDungeon(dungeon.sessionId);
                const leaveResponse = createResponse(PacketType.S_LeaveDungeon, {});
                user.socket.write(leaveResponse);

                console.log(`유저 ${user.id}가 던전 ${dungeon.sessionId}에서 사망하여 퇴장하였습니다.`);
                break;
            }
        } catch (error) {
            console.error('S_MonsterAction 패킷 전송 중 오류 발생:', error);
            return;
        }

        await delay(1000);
    }

    // 몬스터의 공격이 모두 끝난 후 배틀로그
    const endBattleLog = {
        battleLog: {
            msg: '몬스터를 선택하여 공격을 진행해주세요',
            typingAnimation: true,
            btns,
        },
    };

    try {
        user.socket.write(createResponse(PacketType.S_BattleLog, endBattleLog));
    } catch (error) {
        console.error('S_BattleLog 패킷 전송 중 오류 발생:', error);
    }
};
