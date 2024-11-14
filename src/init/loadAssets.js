// src/init/loadAssets.js

// src/init/assets.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    const [playerCharacter] = await Promise.all([
      // 이런 형태로 필요한 파일 로드
      readFileAsync('playerCharacter.json'),
      // readFileAsync('monster.json'),
    ]);
    gameAssets = { playerCharacter };
    return gameAssets;
  } catch (error) {
    throw new Error('Failed to load game assets: ' + error.message);
  }
};

export const getGameAssets = () => {
  return gameAssets;
};

export const getJobById = (jobId) => {
  const index = gameAssets.playerCharacter.data.findIndex((job) => job.id === jobId);
  return gameAssets.playerCharacter.data[index];
};
