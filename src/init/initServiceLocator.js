// src/init/initServiceLocator.js

import serviceLocator from '#locator/serviceLocator.js';
import QueueManager from '#managers/queueManager.js';
import SessionManager from '#managers/sessionManager.js';
import { handleError } from '../utils/error/errorHandler.js';

export const initLocator = async () => {
  try {
    const sessionManagerInstance = new SessionManager();
    serviceLocator.register(SessionManager, sessionManagerInstance);
    const queueManagerInstance = new QueueManager();
    serviceLocator.register(QueueManager, queueManagerInstance);
    // 다른 서비스가 있다면 추가
  } catch (e) {
    handleError(e);
  }
};
