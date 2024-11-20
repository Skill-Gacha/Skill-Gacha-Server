// src/handler/town/cEnterHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createUser, findUserNickname } from '../../db/user/user.db.js';
import { getElementById } from '../../init/loadAssets.js'; // job을 element로 변경
import { createResponse } from '../../utils/response/createResponse.js';
import { sSpawnHandler } from './sSpawnHandler.js';
import { playerData } from '../../utils/packet/playerPacket.js';
import User from '../../classes/models/userClass.js';
import { getSkillsFromDB, saveSkillsToDB } from '../../db/skill/skillDb.js';
import { saveRatingToRedis, saveSkillsToRedis } from '../../db/redis/skillService.js';
import { saveRatingToDB } from '../../db/rating/ratingDb.js';

export const cEnterHandler = async ({ socket, payload }) => {
  const { nickname, class: elementId } = payload; // 'class' 대신 'element' 사용

  // 엘리먼트 유효성 검사
  const chosenElement = getElementById(elementId);
  if (!chosenElement) {
    console.error('존재하지 않는 속성 ID 입니다.');
    return;
  }

  // 세션에 이미 유저가 있는지 확인
  let user = sessionManager.getUserBySocket(socket);
  if (user) {
    console.log(`유저 ${user.id}가 이미 세션에 존재합니다.`);

    // 유저가 현재 마을에 있지 않은 경우, 마을 세션으로 이동
    const currentSession = sessionManager.getSessionByUserId(user.id);
    if (currentSession !== sessionManager.getTown()) {
      // 마을 세션에 유저 추가
      sessionManager.getTown().addUser(user);
      console.log(`유저 ${user.id}가 마을 세션으로 이동되었습니다.`);
    }
  } else {
    console.log('첫 접속 유저');

    // 세션에 유저가 없을 경우, 새로 생성 또는 기존 데이터 로드
    let userRecord;

    // 닉네임 중복 확인
    const existingPlayer = await findUserNickname(nickname);
    if (existingPlayer) {
      // 기존 유저: 데이터 로드
      userRecord = existingPlayer;
    } else {
      // 신규 유저: 캐릭터 정보 생성
      await createUser(
        nickname,
        elementId,
        chosenElement.maxHp,
        chosenElement.maxMp,
      );

      // 기본 스킬 삽입
      await saveSkillsToDB(nickname, { skill1: 1001, skill2: 1002, skill3: 0, skill4: 0 });

      // 기본 레이팅 삽입
      await saveRatingToDB(nickname, 1000);

      // 기본 스킬을 Redis에 저장
      await saveSkillsToRedis(nickname, { skill1: 1001, skill2: 1002, skill3: 0, skill4: 0 });

      // 기본 레이팅을 Redis에 저장
      await saveRatingToRedis(nickname, 1000);

      // 새로 생성된 유저 데이터 로드
      userRecord = await findUserNickname(nickname);
    }

    // User 인스턴스 생성
    user = new User(
      socket,
      userRecord.id,
      userRecord.element, // element 값 전달
      userRecord.nickname,
      userRecord.maxHp,
      userRecord.maxMp,
    );

    // 스킬 처리
    const skills = await getSkillsFromDB(nickname);
    await saveSkillsToRedis(nickname, skills);

    // 유저 인스턴스에 스킬 할당
    user.skills = [skills.skill1, skills.skill2, skills.skill3, skills.skill4];

    // 세션에 유저 추가
    sessionManager.addUser(user);
  }

  // S_Enter 메시지 생성
  const enterData = playerData(user);

  // S_Enter 응답 전송
  const enterResponse = createResponse(PacketType.S_Enter, { player: enterData });
  socket.write(enterResponse);

  // 다른 유저 정보 가져오기
  const otherUsers = Array.from(sessionManager.getTown().users.values()).filter(u => u.id !== user.id);

  // 신규 유저에게 기존 유저 정보 전송
  if (otherUsers.length > 0) {
    const otherPlayersData = otherUsers.map((u) => playerData(u));

    const spawnResponse = createResponse(PacketType.S_Spawn, { players: otherPlayersData });
    socket.write(spawnResponse);
  }

  // 기존 유저들에게 접속한 유저 정보 알림
  await sSpawnHandler(user);
};