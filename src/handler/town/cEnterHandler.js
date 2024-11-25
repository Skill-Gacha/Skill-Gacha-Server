// src/handler/town/cEnterHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createUser, findUserNickname } from '../../db/user/user.db.js';
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
import { getItemsFromRedis, initializeItems, saveItemsToRedis } from '../../db/redis/itemService.js';

export const cEnterHandler = async ({ socket, payload }) => {
  const { nickname, class: elementId } = payload;

  // 엘리먼트 유효성 검사
  const chosenElement = getElementById(elementId);
  if (!chosenElement) {
    console.error('cEnterHandler: 존재하지 않는 속성 ID입니다.');
    return;
  }

  let user = sessionManager.getUserBySocket(socket);
  if (user) {
    user.resetHpMp();
    console.log(`cEnterHandler: 유저 ${user.id}가 이미 세션에 존재합니다.`);

    const currentSession = sessionManager.getSessionByUserId(user.id);
    if (currentSession !== sessionManager.getTown()) {
      sessionManager.getTown().addUser(user);

      // 레디스를 통해 스킬 최신화
      const skillsFromRedis = await getSkillsFromRedis(nickname);

      // 유저 인스턴스에 스킬 할당
      user.userSkills = Object.keys(skillsFromRedis)
        .filter((key) => key.startsWith('skill'))
        .map((key) => getSkillById(skillsFromRedis[key])) // 스킬 ID로 매핑
        .filter((skill) => skill != null); // getSkillById의 결과가 null인 경우 필터링
      console.log(`cEnterHandler: 유저 ${user.id}가 마을 세션으로 이동되었습니다.`);

      const itemsFromRedis = await getItemsFromRedis(nickname);
      if (!itemsFromRedis) {
        // Redis에 아이템이 없을 경우 초기화
        const initializedItems = initializeItems();
        await saveItemsToRedis(nickname, initializedItems);
        user.items = initializedItems;
      } else {
        // Redis에서 가져온 아이템을 배열로 할당
        user.items = itemsFromRedis;
      }
    }
  } else {
    let userRecord;

    const existingPlayer = await findUserNickname(nickname);
    if (existingPlayer) {
      userRecord = existingPlayer;
      const elementIdByRecord = getElementById(userRecord.element);
      userRecord.resists = elementResist(elementIdByRecord);
    } else {
      await createUser(nickname, elementId, chosenElement.maxHp, chosenElement.maxMp);

      const basicSkillId = elementId - 1000;

      await saveSkillsToDB(nickname, {
        skill1: basicSkillId,
        skill2: 0,
        skill3: 0,
        skill4: 0,
      });
      await saveRatingToDB(nickname, 1000);

      await saveSkillsToRedis(nickname, {
        skill1: basicSkillId,
        skill2: 0,
        skill3: 0,
        skill4: 0,
      });
      await saveRatingToRedis(nickname, 1000);

      const initialItems = initializeItems();
      for (let item of initialItems) {
        await saveItemToDB(nickname, item.itemId, item.count);
      }
      await saveItemsToRedis(nickname, initialItems);

      userRecord = await findUserNickname(nickname);
    }

    user = new User(
      socket,
      userRecord.id,
      userRecord.element,
      userRecord.nickname,
      userRecord.maxHp,
      userRecord.maxMp,
      userRecord.gold,
      userRecord.stone,
      userRecord ? userRecord.resists : elementResist(chosenElement),
    );

    const skills = await getSkillsFromDB(nickname);
    await saveSkillsToRedis(nickname, skills);

    user.userSkills = Object.keys(skills)
      .filter((key) => key.startsWith('skill'))
      .map((key) => getSkillById(skills[key]))
      .filter((skill) => skill != null);

    const itemsFromDB = await getItemsFromDB(nickname);
    await saveItemsToRedis(nickname, itemsFromDB);

    const itemsFromRedis = await getItemsFromRedis(nickname);
    if (!itemsFromRedis) {
      const initializedItems = initializeItems();
      await saveItemsToRedis(nickname, initializedItems);
      user.items = initializedItems;
    } else {
      user.items = itemsFromRedis;
    }

    sessionManager.addUser(user);
  }

  const enterData = playerData(user);

  const enterResponse = createResponse(PacketType.S_Enter, { player: enterData });
  socket.write(enterResponse);

  const otherUsers = Array.from(sessionManager.getTown().users.values()).filter(
    (u) => u.id !== user.id,
  );

  if (otherUsers.length > 0) {
    const otherPlayersData = otherUsers.map((u) => playerData(u));

    const spawnResponse = createResponse(PacketType.S_Spawn, { players: otherPlayersData });
    socket.write(spawnResponse);
  }

  // 기존 유저들에게 접속한 유저 정보 알림
  await sSpawnHandler(user);
};
