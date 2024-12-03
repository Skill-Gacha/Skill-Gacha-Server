// src/utils/error/errorHandler.js

import logger from '../log/logger.js';
import { ErrorCodes } from './errorCodes.js';
import CustomError from './customError.js';

export const handleError = (error) => {
  let code, message;

  if (error instanceof CustomError) {
    code = error.code;
    message = error.message;
  } else {
    // 기본 에러 코드 및 메시지 할당
    code = ErrorCodes.INTERNAL_SERVER_ERROR || 50000;
    message = 'Internal Server Error';
  }

  // 에러 로그 기록
  logger.error(`${error instanceof CustomError ? 'CustomError' : 'Unhandled Error'} - Code: ${code} / Message: ${message}`, { stack: error.stack });
};
