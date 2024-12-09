// src/locator/serviceLocator.js

import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';

class ServiceLocator {
  constructor() {
    console.log('Creating ServiceLocator');
    this.services = new Map();
  }

  // 클래스(생성자)를 키로 사용
  register(ClassConstructor, instance) {
    this.services.set(ClassConstructor, instance);
  }

  get(ClassConstructor) {
    if (!this.services.has(ClassConstructor)) {
      throw new CustomError(ErrorCodes.INVALID_SERVICE_LOCATOR, `"${ClassConstructor.name}"는 Locator에 등록돼있지 않습니다.`);
    }
    return this.services.get(ClassConstructor);
  }

  has(ClassConstructor) {
    return this.services.has(ClassConstructor);
  }
}

const serviceLocator = new ServiceLocator();
export default serviceLocator;
