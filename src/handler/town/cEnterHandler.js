// src/handler/town/cEnterHandler.js

import serviceLocator from '#locator/serviceLocator.js';
import { PacketType } from '../../constants/header.js';
import { createUser, findUserNickname } from '../../db/user/userDb.js';
import { getElementById, getSkillById } from '../../init/loadAssets.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { sSpawnHandler } from './sSpawnHandler.js';
import { elementResist, playerData } from '../../utils/packet/playerPacket.js';
import User from '../../classes/models/userClass.js';
import { getSkillsFromDB, saveSkillsToDB } from '../../db/skill/skillDb.js';
import { getSkillsFromRedis, saveSkillsToRedis } from '../../db/redis/skillService.js';
import { saveRatingToDB } from '../../db/rating/ratingDb.js';
import { saveRatingToRedis } from '../../db/redis/ratingService.js';
import { getItemsFromDB, saveItemToDB } from '../../db/item/itemDb.js';
import {
  getItemsFromRedis,
  initializeItems,
  saveItemsToRedis,
} from '../../db/redis/itemService.js';
import logger from '../../utils/log/logger.js';
import SessionManager from '#managers/sessionManager.js';
import Position from '../../classes/models/positionClass.js';

const SKILL_OFFSET = 1000;

export const cEnterHandler = async ({ socket, payload }) => {
  const { nickname, class: elementId } = payload;
  const sessionManager = serviceLocator.get(SessionManager);

  try {
    // 입력값 검증
    const validation = validatePayload(payload);
    if (!validation) {
      logger.error(`cEnterHandler: 잘못된 입력값입니다. 닉네임: ${nickname}, 속성ID: ${elementId}`);
      return;
    }

    // 속성 유효성 검사
    const chosenElement = getElementById(elementId);
    if (!chosenElement) {
      logger.error('cEnterHandler: 존재하지 않는 속성 ID입니다.');
      return;
    }

    let user = sessionManager.getUserBySocket(socket);
    if (user) {
      await handleExistingUser(user, nickname, chosenElement);
    } else {
      user = await handleConnectingUser(nickname, elementId, chosenElement, socket);
      sessionManager.addUser(user);
    }

    // 클라이언트에게 현재 유저 정보 전송
    const enterData = playerData(user);
    const enterResponse = createResponse(PacketType.S_Enter, { player: enterData });
    socket.write(enterResponse);

    // 내 화면에 다른 플레이어 스폰
    await spawnOtherUsers(user);

    // 다른 플레이어에게 나를 알림
    await sSpawnHandler(user);
  } catch (error) {
    logger.error('cEnterHandler 에러:', error);
  }
};

// 입력 검증
const validatePayload = (payload) => {
  const { nickname, class: elementId } = payload;

  if (typeof nickname !== 'string' || nickname.length < 2 || nickname.length > 10) {
    return false;
  }

  if (typeof elementId !== 'number' || elementId < 1001 || elementId > 1005) {
    return false;
  }

  return true;
};

const handleExistingUser = async (user, nickname, chosenElement) => {
  try {
    const sessionManager = serviceLocator.get(SessionManager);
    user.resetHpMp();
    logger.info(`cEnterHandler: 유저 ${user.id}가 이미 세션에 존재합니다.`);

    const currentSession = sessionManager.getSessionByUserId(user.id);
    if (currentSession !== sessionManager.getTown()) {
      sessionManager.getTown().addUser(user);

      // 스킬 및 아이템 로드
      const [skillsFromRedis, itemsFromRedis] = await Promise.all([
        getSkillsFromRedis(nickname),
        getItemsFromRedis(nickname),
      ]);

      user.userSkills = loadUserSkills(skillsFromRedis);
      logger.info(`cEnterHandler: 유저 ${user.id}가 마을 세션으로 이동되었습니다.`);

      if (!itemsFromRedis) {
        const initializedItems = initializeItems();
        await saveItemsToRedis(nickname, initializedItems);
        user.items = initializedItems;
      } else {
        user.items = itemsFromRedis;
      }

      user.position = new Position(0, 0, 0, 0);
    }
  } catch (error) {
    logger.error(`cEnterHandler: handleExistingUser 에러; 유저 ID: ${user.id}:`, error);
    throw error;
  }
};

const handleConnectingUser = async (nickname, classId, chosenElement, socket) => {
  try {
    let userRecord = await findUserNickname(nickname);

    if (!userRecord) {
      userRecord = await createNewUser(nickname, classId, chosenElement);
    } else {
      const elementByRecord = getElementById(userRecord.element);
      userRecord.resists = elementResist(elementByRecord);
    }

    const user = new User(
      socket,
      userRecord.id,
      userRecord.element,
      userRecord.nickname,
      userRecord.maxHp,
      userRecord.maxMp,
      userRecord.gold,
      userRecord.stone,
      userRecord.resists || elementResist(chosenElement),
    );

    // 스킬 및 아이템 로드
    const [skills, itemsFromDB] = await Promise.all([
      getSkillsFromDB(nickname),
      getItemsFromDB(nickname),
    ]);

    await Promise.all([
      saveSkillsToRedis(nickname, skills),
      saveItemsToRedis(nickname, itemsFromDB),
    ]);

    user.userSkills = loadUserSkills(skills);

    const itemsFromRedis = await getItemsFromRedis(nickname);

    let itemRedisResult = null;

    if (!itemsFromRedis) {
      const initializedItems = initializeItems();
      await saveItemsToRedis(nickname, initializedItems);
      itemRedisResult = initializedItems;
    } else {
      itemRedisResult = itemsFromRedis;
    }

    // Redis에서 나온 아이템 결과 넣기
    //[{itemId, itemcount},{itemId, itemcount},{itemId, itemcount},{itemId, itemcount},{itemId, itemcount}]
    user.initItemCount(itemRedisResult);

    return user;
  } catch (error) {
    logger.error(`cEnterHandler: handleNewOrReturningUser 에러; 닉네임: ${nickname}:`, error);
    throw error;
  }
};

const createNewUser = async (nickname, classId, chosenElement) => {
  try {
    await createUser(nickname, classId, chosenElement.maxHp, chosenElement.maxMp);

    const basicSkillId = classId - SKILL_OFFSET;

    const skillData = {
      skill1: basicSkillId,
      skill2: 0,
      skill3: 0,
      skill4: 0,
    };

    await Promise.all([
      saveSkillsToDB(nickname, skillData),
      saveRatingToDB(nickname, 1000),
      saveSkillsToRedis(nickname, skillData),
      saveRatingToRedis(nickname, 1000),
    ]);

    const initialItems = initializeItems();
    await Promise.all(initialItems.map((item) => saveItemToDB(nickname, item.itemId, item.count)));
    await saveItemsToRedis(nickname, initialItems);

    return await findUserNickname(nickname);
  } catch (error) {
    logger.error(`cEnterHandler: createNewUser 에러; 닉네임: ${nickname}:`, error);
    throw error;
  }
};

const loadUserSkills = (skillsData) => {
  return Object.keys(skillsData)
    .filter((key) => key.startsWith('skill'))
    .map((key) => getSkillById(skillsData[key]))
    .filter((skill) => skill != null);
};

const spawnOtherUsers = async (user) => {
  try {
    const sessionManager = serviceLocator.get(SessionManager);
    const townSession = sessionManager.getTown();
    const otherUsers = Array.from(townSession.users.values()).filter((u) => u.id !== user.id);

    if (otherUsers.length > 0) {
      const otherPlayersData = otherUsers.map((otherUser) => playerData(otherUser));
      const spawnResponse = createResponse(PacketType.S_Spawn, { players: otherPlayersData });
      user.socket.write(spawnResponse);
    }
  } catch (error) {
    logger.error(`cEnterHandler: notifyOtherUsers 에러; 유저ID: ${user.id}:`, error);
    throw error;
  }
};
