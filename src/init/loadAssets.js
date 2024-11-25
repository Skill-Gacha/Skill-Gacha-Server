// src/init/loadAssets.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MAX_SKILL_REWARD, SKILL_RANK } from '../constants/battle.js';
import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';

// import.meta.url은 현재 모듈의 URL을 나타내는 문자열
// fileURLToPath는 URL 문자열을 파일 시스템의 경로로 변환

// 현재 파일의 절대 경로. 이 경로는 파일의 이름을 포함한 전체 경로
const __filename = fileURLToPath(import.meta.url);

// path.dirname() 함수는 파일 경로에서 디렉토리 경로만 추출 (파일 이름을 제외한 디렉토리의 전체 경로)
const __dirname = path.dirname(__filename);
const basePath = path.join(__dirname, '../../assets');
let gameAssets = {}; // 전역함수로 선언

const readFileAsync = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(basePath, filename), 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      // BOM 제거
      const cleanData = data.replace(/^\uFEFF/, '');
      try {
        resolve(JSON.parse(cleanData));
      } catch (jsonErr) {
        reject(new Error(`Invalid JSON format in file: ${filename}`));
      }
    });
  });
};

export const loadGameAssets = async () => {
  try {
    const [playerCharacter, MonsterData, skillData, productData] = await Promise.all([
      // 이런 형태로 필요한 파일 로드

      readFileAsync('playerCharacter.json'),
      readFileAsync('MonsterData.json'), // 몬스터 상태 파일 추가
      readFileAsync('skillData.json'),
      readFileAsync('productData.json'),
    ]);

    gameAssets = { playerCharacter, MonsterData, skillData, productData };

    console.log('게임 애샛 로드 완료');
  } catch (error) {
    throw new Error('Failed to load game assets: ' + error.message);
  }
};

export const getGameAssets = () => {
  return gameAssets;
};

export const getElementById = (elementId) => {
  const index = gameAssets.playerCharacter.data.findIndex((element) => element.id === elementId);
  return gameAssets.playerCharacter.data[index];
};

export const getSkillById = (skillId) => {
  if (skillId >= 1) {
    const index = gameAssets.skillData.data.findIndex((skill) => skill.id === skillId);
    return gameAssets.skillData.data[index];
  }
  return null;
};

// 랜덤으로 스킬 가져오기
export const getRandomRewardSkills = (dungeonCode) => {
  // 2가지 랭크를 담아야 함
  let ranks = [];
  // 던전 코드에 따라 등급 구분하기
  switch (dungeonCode) {
    case 1:
      ranks = [SKILL_RANK.NORMAL, SKILL_RANK.RARE];
      break;
    case 2:
      ranks = [SKILL_RANK.RARE, SKILL_RANK.EPIC];
      break;
    case 3:
      ranks = [SKILL_RANK.EPIC, SKILL_RANK.UNIQUE];
      break;
    case 4:
      ranks = [SKILL_RANK.UNIQUE, SKILL_RANK.LEGENDARY];
      break;
    default:
      throw new CustomError(ErrorCodes.DUNGEON_CODE_NOT_FOUND, 'Dungeon code not found.');
  }

  // 3번 반복하여 랜덤 스킬 3개 빼오기
  const rewardSkills = [];
  for (let i = 0; i < MAX_SKILL_REWARD; i++) {
    // 90% 확률로 첫번째 rank를 10% 확률로 2번째 rank를
    const randomRank = Math.random() < 0.9 ? ranks[0] : ranks[1];
    // 결정된 랭크를 토대로 스킬 랜덤으로 가져오기
    const randomSkills = gameAssets.skillData.data.filter((skill) => skill.rank === randomRank);
    // 걸러진 스킬 5개중 랜덤으로 스킬 선택
    const randomSkillIdx = Math.floor(Math.random() * randomSkills.length);
    const randomskill = randomSkills[randomSkillIdx];
    rewardSkills.push({
      id: randomskill.id,
      rank: randomskill.rank,
      skillName: randomskill.skillName,
    });
  }

  return rewardSkills;
};

// 아이템 불러오기
export const getProductById = (productId) => {
  const index = gameAssets.productData.data.findIndex((product) => product.id === productId);
  return gameAssets.productData.data[index];
};

export const getProductData = () => {
  return gameAssets.productData.data;
};
