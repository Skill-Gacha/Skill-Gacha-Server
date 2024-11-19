// src/init/index.js

import testConnection from '../utils/db/testConnection.js';
import { loadProtos } from './loadProto.js';
import { loadGameAssets } from './loadAssets.js';
import { initRedisClient } from './redis.js';

const initServer = async () => {
  try {
    await loadProtos();
    await loadGameAssets();
    await testConnection();
    await initRedisClient();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

export default initServer;
