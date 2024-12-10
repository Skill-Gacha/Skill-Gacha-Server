// src/locator/serviceLocator.js

import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import logger from '../utils/log/logger.js';

class ServiceLocator {
  constructor() {
    this.services = new Map();
    logger.info('서비스 로케이터 초기화');
  }

  // 클래스(생성자)를 키로 사용
  register(ClassConstructor, instance) {
    this.services.set(ClassConstructor, instance);
    logger.info(`로케이터에 ${ClassConstructor.name} 등록 완료.`);
  }

  get(ClassConstructor) {
    if (!this.services.has(ClassConstructor)) {
      throw new CustomError(
        ErrorCodes.INVALID_SERVICE_LOCATOR,
        `"${ClassConstructor.name}"는 Locator에 등록돼있지 않습니다.`,
      );
    }
    return this.services.get(ClassConstructor);
  }

  has(ClassConstructor) {
    return this.services.has(ClassConstructor);
  }
}

const serviceLocator = new ServiceLocator();
export default serviceLocator;
