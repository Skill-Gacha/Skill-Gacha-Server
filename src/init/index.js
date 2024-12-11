// src/init/index.js

import testConnection from '../utils/db/testConnection.js';
import { loadProtos } from './loadProto.js';
import { loadGameAssets } from './loadAssets.js';
import { initRedisClient } from './redis.js';
import { startSyncScheduler } from '../schedulers/syncScheduler.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import CustomError from '../utils/error/customError.js';
import { initLocator } from './initServiceLocator.js';
import initializeRedis from './initRedisData.js';

const initServer = async () => {
  try {
    await loadProtos();
    await loadGameAssets();
    await testConnection();
    await initRedisClient();
    await initializeRedis();
    await initLocator();
    await startSyncScheduler();
  } catch (e) {
    throw new CustomError(ErrorCodes.INITIALIZE_FAILED, `서버 초기화 실패: ${e}`);
  }
};

export default initServer;
