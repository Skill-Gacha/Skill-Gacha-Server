// src/handler/town/enhanceForge/cEnhanceHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { getNextRankAndSameElement, getSkillById } from '../../../init/loadAssets.js';
import {  saveRewardSkillsToRedis } from '../../../db/redis/skillService.js';

export const cEnhanceHandler = async ({ socket, payload }) => {
    const user = sessionManager.getUserBySocket(socket);

    if (!user) {
        console.error('cEnhanceHandler: 사용자가 속한 세션을 찾을 수 없습니다.');
        return;
    }

    const { skillCode } = payload;

    const currentSkill = getSkillById(skillCode);
    if (!currentSkill) {
        console.error('cEnhanceHandler: 잘못된 스킬 코드입니다.');
        return;
    }

    let requiredStone, requiredGold, successRate, downgradeRate;

    // 스킬의 랭크에 따른 요구 자원들
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
    return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
}

const success = Math.random() < successRate; // 성공
const downgrade = !success && Math.random() < downgradeRate; // 하락

try {
    if (success) {
        await user.reduceResource(requiredGold, requiredStone);
        // 스킬 강화 성공
        const nextRankSkillId = getNextRankAndSameElement(currentSkill.rank + 1, currentSkill.element);
        
        if (!nextRankSkillId) {
            console.error('cEnhanceHandler: 다음 랭크의 스킬을 찾을 수 없습니다.');
            return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
        }

        // 기존 스킬 제거 및 새로운 스킬 추가
        const skillIndex = user.userSkills.findIndex(skill => skill.id === skillCode);
        const newSkill = getSkillById(nextRankSkillId);
        
        if (skillIndex !== -1) {
            user.userSkills.splice(skillIndex, 1, newSkill); // 기존 스킬 제거 및 새로운 스킬 추가
        } else {
            console.error('cEnhanceHandler: 기존 스킬을 찾을 수 없습니다.');
            return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
        }

        // Redis에 업데이트
        const newSkillIndex = user.userSkills.findIndex(skill => skill.id === newSkill.id);
        if (newSkillIndex >= 0 && newSkillIndex < 4) { // 인덱스 범위 체크
            await saveRewardSkillsToRedis(user.nickname, newSkill.id, newSkillIndex + 1); // 1-based index
        } else {
            console.error('cEnhanceHandler: 잘못된 스킬 인덱스입니다.');
            return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
        }

        console.log(`스킬 강화 성공: ${currentSkill.skillName} -> ${nextRankSkillId}`);

        // 최종적으로 응답 데이터 업데이트
        let enhanceUiResponse;
        try {
            enhanceUiResponse = createResponse(PacketType.S_EnhanceUiResponse, {
                gold: user.gold, // 현재 골드
                stone: user.stone, // 현재 스톤
                skillCode: user.userSkills.map(skill => skill.id), // 현재 보유한 스킬 코드 목록
            });
        } catch (error) {
            console.error('cEnhanceHandler: 응답 데이터 생성 중 오류 발생:', error);
            return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
        }

        // 사용자에게 응답 전송
        try {
            socket.write(enhanceUiResponse);
        } catch (error) {
            console.error('cEnhanceHandler: 패킷 전송 중 오류 발생:', error);
            return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
        }

        return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: true }));
    } else if (downgrade) {
        // 스킬 하락 처리
        await user.reduceResource(requiredGold, requiredStone);
        const downgradeSkillId = getNextRankAndSameElement(currentSkill.rank - 1, currentSkill.element);
        if (!downgradeSkillId) {
            console.error('cEnhanceHandler: 하락할 스킬을 찾을 수 없습니다.');
            return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
        }

        // 기존 스킬 제거 및 새로운 하락 스킬 추가
        const downgradeSkillIndex = user.userSkills.findIndex(skill => skill.id === skillCode);
        const downgradeSkill = getSkillById(downgradeSkillId);
        
        if (downgradeSkillIndex !== -1) {
            user.userSkills.splice(downgradeSkillIndex, 1, downgradeSkill); // 기존 스킬 제거 및 새로운 하락 스킬 추가
        } else {
            console.error('cEnhanceHandler: 기존 스킬을 찾을 수 없습니다.');
            return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
        }

        // Redis에 업데이트
        const newDowngradeSkillIndex = user.userSkills.findIndex(skill => skill.id === downgradeSkill.id);
        if (newDowngradeSkillIndex >= 0 && newDowngradeSkillIndex < 4) { // 인덱스 범위 체크
            await saveRewardSkillsToRedis(user.nickname, downgradeSkill.id, newDowngradeSkillIndex + 1); // 1-based index
        } else {
            console.error('cEnhanceHandler: 잘못된 하락 스킬 인덱스입니다.');
            return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
        }

        console.log(`스킬 하락: ${currentSkill.skillName} -> ${downgradeSkill.skillName}`);
        return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
    } else {
        await user.reduceResource(requiredGold, requiredStone);
        // 스킬 강화 실패
        console.log('스킬 강화 실패');
        return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
    }
} catch (error) {
    console.error('cEnhanceHandler: 처리 중 오류 발생:', error);
    return socket.write(createResponse(PacketType.S_EnhanceResponse, { success: false }));
}
};