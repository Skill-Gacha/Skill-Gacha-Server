// src/handler/town/enhanceForge/cEnhanceHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import {getNextRankAndSameElement, getSkillById} from '../../../init/loadAssets.js'; 

export const cEnhanceHandler = async ({ socket, payload }) => {
    const user = sessionManager.getUserBySocket(socket);

    if (!user) {
        console.error('cEnhanceHandler: 사용자가 속한 세션을 찾을 수 없습니다.');
        return;
    }

    const { skillCode } = payload; ; 
    console.log('스킬 코드 잘 불러와? ' , skillCode);

    const currentSkill = getSkillById(skillCode);

    if (!currentSkill) {
        console.error('cEnhanceHandler: 잘못된 스킬 코드입니다.');
        return;
    }

    let requiredStone, requiredGold, successRate, downgradeRate;

    //스킬의 랭크에 따른 요구 자원들
    switch (currentSkill.rank) {
        case 100: // 노말
            requiredStone = 5;
            requiredGold = 1000;
            successRate = 0.5;
            downgradeRate = 0; // 하락 없음
            break;
        case 101: // 레어
            requiredStone = 20;
            requiredGold = 3000;
            successRate = 0.3;
            downgradeRate = 0; // 하락 없음
            break;
        case 102: // 에픽
            requiredStone = 30;
            requiredGold = 5000;
            successRate = 0.1;
            downgradeRate = 0.1; // 10% 하락
            break;
        case 103: // 유니크
            requiredStone = 50;
            requiredGold = 10000;
            successRate = 0.05;
            downgradeRate = 0.05; // 5% 하락
            break;
        case 104: // 레전더리
            console.error('cEnhanceHandler: 레전더리 스킬은 더 이상 업그레이드할 수 없습니다.');
            return;
        default:
            console.error('cEnhanceHandler: 잘못된 스킬 랭크입니다.');
            return;
    }

    // 유저 자원 확인
    if (user.stone < requiredStone || user.gold < requiredGold) {
        console.error('cEnhanceHandler: 자원이 부족합니다. 필요한 스톤:', requiredStone, '현재 스톤:', user.stone, '필요한 골드:', requiredGold, '현재 골드:', user.gold);
        return;
    }
    if (!user.skillCodes) {
        user.skillCodes = [];
    }
    
    const success = Math.random() < successRate; //성공
    const downgrade = !success && Math.random() < downgradeRate; //하락
    
    // 응답 데이터 생성
    const enhanceResponse = createResponse(PacketType.S_EnhanceResponse, {
        success,
    });

    if (success) {
        try {
            await user.reduceResource(requiredGold, requiredStone); // 자원 감소
            const newSkillCode = getNextRankAndSameElement(currentSkill.rank + 1, currentSkill.element);
            if (newSkillCode) {
                user.skillCodes.push(newSkillCode); // 성공한 스킬 코드 추가
                console.log(newSkillCode);
            }
        } catch (error) {
            console.error('cEnhanceHandler: 자원 감소 중 오류 발생', error);
            enhanceResponse.success = false; // 자원 감소 실패
        }
    } else if (downgrade) {
        // 하락 처리
        const downgradeSkillCode = getNextRankAndSameElement(currentSkill.rank - 1, currentSkill.element);
        if (downgradeSkillCode) {
            user.skillCodes = user.skillCodes.filter(skillId => skillId !== skillCode); // 현재 스킬 제거
            user.skillCodes.push(downgradeSkillCode); // 하락한 스킬 추가
            console.log(`스킬이 하락했습니다: ${currentSkill.skillName} -> ${downgradeSkillCode}`);
        }
    }
    console.log()

    // 사용자에게 응답 전송
    try {
        socket.write(enhanceResponse);
    } catch (error) {
        console.error('cEnhanceHandler: 패킷 전송 중 오류 발생:', error);
    }
};