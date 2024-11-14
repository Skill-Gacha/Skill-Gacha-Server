// src/init/index.js

import testConnection from '../utils/db/testConnection.js';
import { loadProtos } from './loadProto.js';
import { loadGameAssets } from './loadAssets.js';

const initServer = async () => {
  try {
    await loadProtos();
    await loadGameAssets();
    await testConnection();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

export default initServer;
