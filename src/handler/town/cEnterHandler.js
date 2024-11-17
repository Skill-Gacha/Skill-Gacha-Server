// src/handlers/cEnterHandler.js

import sessionManager from '#managers/SessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createUser, findUserNickname } from '../../db/user/user.db.js';
import { getJobById } from '../../init/loadAssets.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { sSpawnHandler } from './sSpawnHandler.js';
import { playerData } from '../../utils/packet/playerPacket.js';
import User from '../../classes/models/userClass.js';

export const cEnterHandler = async ({ socket, payload }) => {
  const { nickname, class: jobClass } = payload;

  // 직업 유효성 검사
  const chosenJob = getJobById(jobClass);
  if (!chosenJob) {
    console.error('존재하지 않는 직업입니다.');
    return;
  }

  let newUser;
  // 닉네임 중복 확인
  const existingPlayer = await findUserNickname(nickname);
  if (existingPlayer) {
    // 존재하는 유저일 경우, 기존 정보 불러오기
    newUser = existingPlayer;
  } else {
    // 새로운 사용자 생성 및 DB에 저장
    await createUser(
      nickname,
      jobClass,
      1, // 초기 레벨
      chosenJob.maxHp,
      chosenJob.maxMp,
      chosenJob.atk,
      chosenJob.def,
      chosenJob.magic,
      chosenJob.speed,
    );
    newUser = await findUserNickname(nickname);
  }

  // User 클래스 인스턴스 생성
  const user = new User(
    socket,
    newUser.id,
    nickname,
    newUser.maxHp,
    newUser.maxMp,
    newUser.atk,
    newUser.def,
    newUser.magic,
    newUser.speed,
  );
  user.job = newUser.job;
  user.level = newUser.level;

  // 위치 정보 설정
  user.position = { posX: 0, posY: 0, posZ: 0, rot: 0 };

  // 스탯 정보 설정
  user.stat = {
    level: newUser.level,
    hp: newUser.maxHp,
    maxHp: newUser.maxHp,
    mp: newUser.maxMp,
    maxMp: newUser.maxMp,
    atk: newUser.atk,
    def: newUser.def,
    magic: newUser.magic,
    speed: newUser.speed,
  };

  // sessionManager를 통해 사용자 추가
  sessionManager.addUser(user);

  // S_Enter 메시지 생성
  const enterData = playerData(user);

  // S_Enter 응답 전송
  const enterResponse = createResponse(PacketType.S_Enter, { player: enterData });
  socket.write(enterResponse);

  // 다른 사용자 정보 가져오기
  const otherUsers = Array.from(sessionManager.getTown().users.values()).filter(u => u.id !== user.id);

  // 새로운 사용자에게 기존 사용자들의 정보를 S_Spawn 메시지로 전송
  if (otherUsers.length > 0) {
    const otherPlayersData = otherUsers.map((u) => playerData(u));

    const spawnResponse = createResponse(PacketType.S_Spawn, { players: otherPlayersData });
    socket.write(spawnResponse);
  }

  // 기존 사용자들에게 새로운 사용자 정보를 S_Spawn 메시지로 전송
  await sSpawnHandler(user);
};
