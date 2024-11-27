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
    const enhanceResponse = {
        success,
    };

    if (success) {
        try {
            await user.reduceResource(requiredGold, requiredStone); // 자원 감소
            const newSkillCode = getNextRankAndSameElement(currentSkill.rank + 1, currentSkill.element);
            
            // 스킬 코드 업데이트
            if (newSkillCode) {
                // 현재 스킬 코드 제거
                user.skillCodes = user.skillCodes.filter(skillId => skillId !== skillCode);
                
                // 새로운 스킬 코드가 이미 존재하지 않을 경우에만 추가
                if (!user.skillCodes.includes(newSkillCode)) {
                    user.skillCodes.push(newSkillCode); // 새로운 스킬 코드 추가
                
                    // 새로운 스킬 정보를 가져와서 user.userSkills에 추가
                    const newSkill = getSkillById(newSkillCode);
                    if (newSkill) {
                        user.userSkills.push(newSkill); // userSkills에 새로운 스킬 추가
                    }
                    console.log(`스킬 업그레이드: ${currentSkill.skillName} -> ${newSkill.skillName}`);
                } else {
                    console.error('cEnhanceHandler: 이미 보유한 스킬 코드입니다. 업그레이드 실패.');
                    enhanceResponse.success = false; // 업그레이드 실패
                }
            }

            // 동일한 element를 가진 스킬 필터링
            const uniqueSkills = {};
            user.skillCodes.forEach(skillId => {
                const skill = getSkillById(skillId);
                if (skill) {
                    if (!uniqueSkills[skill.element] || uniqueSkills[skill.element].rank < skill.rank) {
                        uniqueSkills[skill.element] = skill; // 높은 rank의 스킬로 업데이트
                    }
                }
            });
            user.skillCodes = Object.values(uniqueSkills).map(skill => skill.id); // 최종 스킬 코드 목록 생성
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
     // 최종적으로 응답 데이터 업데이트
    const enhanceUiResponse = createResponse(PacketType.S_EnhanceUiResponse, {
        gold: user.gold, // 현재 골드
        stone: user.stone, // 현재 스톤
        skillCode: user.skillCodes, // 현재 보유한 스킬 코드 목록
    });

    // 사용자에게 응답 전송
    try {
        socket.write(enhanceUiResponse);
    } catch (error) {
        console.error('cEnhanceHandler: 패킷 전송 중 오류 발생:', error);
    }
};