// src/handler/town/enhanceForge/cEnhanceUiHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';

export const cEnhanceUiHandler = async ({ socket }) => {
  const user = sessionManager.getUserBySocket(socket);

  if (!user) {
    console.error('cEnhanceUiHandler: 사용자가 속한 세션을 찾을 수 없습니다.');
    return;
  }

  try {
    // 사용자의 스킬 정보 가져오기
    const userSkills = user.userSkills;

    // 사용자의 스킬 코드 목록 생성
    const skillCodes = userSkills.map(skill => skill.id); // 사용자 스킬에서 ID 추출

    const enhanceUiData = {
      gold: user.gold, // 보유 골드
      stone: user.stone, // 보유 강화석
      skillCode: skillCodes, // 보유한 스킬 코드 목록
    };

    // 응답 패킷 생성
    const enhanceUiResponse = createResponse(PacketType.S_EnhanceUiResponse, enhanceUiData);

    // 사용자에게 응답 전송
    socket.write(enhanceUiResponse);
  } catch (error) {
    console.error('cEnhanceUiHandler: 스킬 정보를 가져오는 중 오류 발생:', error);
  }
};