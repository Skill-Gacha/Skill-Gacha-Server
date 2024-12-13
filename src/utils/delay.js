// src/utils/delay.js

import ServiceLocator from '#locator/serviceLocator.js';
import timerManager from '#managers/timerManager.js';

// 지연 함수 (타이머 매니저 사용)
export const delay = (ms) => {
  return new Promise((resolve) => {
    const timerMgr = ServiceLocator.get(timerManager);
    timerMgr.requestTimer(ms, resolve);
  });
};

// 취소 가능한 지연
export const delayWithCancel = (ms) => {
  const timerMgr = ServiceLocator.get(timerManager);
  let timerId;

  const promise = new Promise((resolve) => {
    timerId = timerMgr.requestTimer(ms, resolve);
  });

  return {
    promise,
    cancel: () => timerMgr.cancelTimer(timerId),
  };
};
