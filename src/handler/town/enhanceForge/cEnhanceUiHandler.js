// src/handler/town/enhanceForge/cEnhanceUiHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { getUserSkills } from '../../../init/loadAssets.js';
import { createResponse } from '../../../utils/response/createResponse.js';


export const cEnhanceUiHandler = async ({ socket }) => {
    const user = sessionManager.getUserBySocket(socket);

    if (!user) {
        console.error('cEnhanceUiHandler: 사용자가 속한 세션을 찾을 수 없습니다.');
        return;
    }

    // 사용자의 캐릭터 정보와 스킬 정보 가져오기
    const userSkills = getUserSkills(user);

    // 현재 사용자의 자원 및 스킬 코드 목록을 포함한 데이터 생성
    const enhanceUiData = {
        gold: user.gold,
        stone: user.stone,
        skillCodes: userSkills.map(skill => skill.id), // 현재 보유한 스킬 코드 목록
    };
    console.log('enhanceUiData의 데이타를 가져오니? ', enhanceUiData );
    // 강화 UI 열기 응답 생성
    const enhanceUiResponse = createResponse(PacketType.S_EnhanceUiResponse, enhanceUiData);

    // 응답 패킷 전송
    try {
        user.socket.write(enhanceUiResponse);
    } catch (error) {
        console.error('cEnhanceUiHandler: 패킷 전송 중 오류 발생:', error);
    }
};