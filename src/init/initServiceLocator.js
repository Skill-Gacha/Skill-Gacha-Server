// src/init/initServiceLocator.js

import serviceLocator from '#locator/serviceLocator.js';
import QueueManager from '#managers/queueManager.js';
import SessionManager from '#managers/sessionManager.js';
import { handleError } from '../utils/error/errorHandler.js';
import TimerManager from '#managers/timerManager.js';

export const initLocator = async () => {
  try {
    // 세션 매니저
    const sessionManagerInstance = new SessionManager();
    serviceLocator.register(SessionManager, sessionManagerInstance);
    
    // 큐 매니저
    const queueManagerInstance = new QueueManager();
    serviceLocator.register(QueueManager, queueManagerInstance);
    
    // 타이머 매니저
    const timerManagerInstance = new TimerManager();
    serviceLocator.register(TimerManager, timerManagerInstance);
    // 다른 서비스가 있다면 추가
  } catch (e) {
    handleError(e);
  }
};
