// src/utils/delay.js

import ServiceLocator from '#locator/serviceLocator.js';
import timerManager from '#managers/timerManager.js';

export const delay = (ms) => {
  return new Promise((resolve) => {
    const timerMgr = ServiceLocator.get(timerManager);
    timerMgr.requestTimer(ms, resolve);
  });
};

export const delayWithCancel = (ms) => {
  let timerId;
  const promise = new Promise((resolve, reject) => {
    timerId = timerMgr.requestTimer(ms, resolve);
  });

  return {
    promise,
    cancel: () => timerMgr.cancelTimer(timerId),
  };
};
