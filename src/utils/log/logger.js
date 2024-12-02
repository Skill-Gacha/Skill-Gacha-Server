// src/utils/log/logger.js

import winston from 'winston';
import moment from 'moment-timezone';

const { combine, timestamp, printf, errors } = winston.format;

const koreanTimeFormat = printf(({ level, message, timestamp, stack }) => {
  const koreanTime = moment(timestamp).tz('Asia/Seoul');
  const formattedTime = koreanTime.format('YYYY-MM-DD HH:mm:ss UTC+0900');
  return stack
    ? `${formattedTime} ${level}: ${message}\n${stack}`
    : `${formattedTime} ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    koreanTimeFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

export default logger;