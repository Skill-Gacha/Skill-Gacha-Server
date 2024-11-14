import { PacketType } from '../../constants/header.js';
import { createUser, findUserNickname } from '../../db/user/user.db.js';
import { getJobById } from '../../init/loadAssets.js';
import { createResponse } from '../../utils/response/createResponse.js';
import User from '../../classes/models/userClass.js';
import { addUserAtTown, getAllUserExceptMyself } from '../../sessions/townSession.js';
import { sSpawnHandler } from './sSpawnHandler.js';
import { addUser } from '../../sessions/userSession.js';

export const sEnterHandler = async ({ socket, payload }) => {
  const { nickname, class: jobClass } = payload;

  // 직업 유효성 검사
  const chosenJob = getJobById(jobClass);
  if (!chosenJob) {
    console.error('존재하지 않는 직업입니다.');
    return;
  }
  
  // 닉네임 중복 확인
  const existingPlayer = await findUserNickname(nickname);
  if (existingPlayer) {
    console.error('이미 존재하는 닉네임입니다.');
    return;
  }

  // 새로운 사용자 생성 및 DB에 저장
  const newUser = await createUser(
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

  // User 클래스 인스턴스 생성
  const user = new User(socket, newUser.id, nickname);
  user.job = newUser.job;
  user.level = newUser.level;

  // 위치 정보 설정
  user.position.posX = 0;
  user.position.posY = 0;
  user.position.posZ = 0;
  user.position.rot = 0;
  
  // 스탯 정보 설정
  user.stat.hp = newUser.maxHp;
  user.stat.maxHp = newUser.maxHp;
  user.stat.mp = newUser.maxMp;
  user.stat.maxMp = newUser.maxMp;
  user.stat.atk = newUser.atk;
  user.stat.def = newUser.def;
  user.stat.magic = newUser.magic;
  user.stat.speed = newUser.speed;

  // townSession에 사용자 추가
  await addUserAtTown(user);
  await addUser(user);

  // S_Enter 메시지 생성
  const enterData = {
    player: {
      playerId: user.id,
      nickname: user.nickname,
      class: user.job,
      transform: {
        posX: user.position.posX,
        posY: user.position.posY,
        posZ: user.position.posZ,
        rot: user.position.rot,
      },
      statInfo: {
        level: user.level,
        hp: user.stat.hp,
        maxHp: user.stat.maxHp,
        mp: user.stat.mp,
        maxMp: user.stat.maxMp,
        atk: user.stat.atk,
        def: user.stat.def,
        magic: user.stat.magic,
        speed: user.stat.speed,
      },
    },
  };

  // S_Enter 응답 전송
  const enterResponse = createResponse(PacketType.S_Enter, enterData);
  socket.write(enterResponse);

  // 다른 사용자 정보 가져오기
  const otherUsers = await getAllUserExceptMyself(user.id);

  // 새로운 사용자에게 기존 사용자들의 정보를 S_Spawn 메시지로 전송
  if (otherUsers.length > 0) {
    const otherPlayersData = otherUsers.map((u) => ({
      playerId: u.id,
      nickname: u.nickname,
      class: u.job,
      transform: {
        posX: u.position.posX,
        posY: u.position.posY,
        posZ: u.position.posZ,
        rot: u.position.rot,
      },
      statInfo: {
        level: u.level,
        hp: u.stat.hp,
        maxHp: u.stat.maxHp,
        mp: u.stat.mp,
        maxMp: u.stat.maxMp,
        atk: u.stat.atk,
        def: u.stat.def,
        magic: u.stat.magic,
        speed: u.stat.speed,
      },
    }));

    const spawnResponse = createResponse(PacketType.S_Spawn, { players: otherPlayersData });
    socket.write(spawnResponse);
  }

  // 기존 사용자들에게 새로운 사용자 정보를 S_Spawn 메시지로 전송
  await sSpawnHandler(user);
};
