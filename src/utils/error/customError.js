// src/utils/error/customError.js

import { ErrorNames } from './errorCodes.js';

class CustomError extends Error {
  constructor(code, message) {
    message = message || ErrorNames[code] || 'Unknown Error';
    super(message);
    this.code = code;
    this.name = 'CustomError';
  }
}

export default CustomError;
