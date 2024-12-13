// src/utils/log/logger.js

import winston from 'winston';
import moment from 'moment-timezone';
import fs from 'fs-extra';
import path from 'path';

const { combine, timestamp, printf, errors } = winston.format;

const koreanTimeFormat = printf(({ level, message, timestamp, stack }) => {
  const koreanTime = moment(timestamp).tz('Asia/Seoul');
  const formattedTime = koreanTime.format('YYYY-MM-DD HH:mm:ss UTC+0900');
  return stack ? `${formattedTime} ${level}: ${message}\n${stack}` : `${formattedTime} ${level}: ${message}`;
});

const logDirectory = path.resolve('logs');
const getLogDir = () => {
  const date = moment().tz('Asia/Seoul').format('YYYY-MM-DD');
  return path.join(logDirectory, date);
};

const ensureLogDirExists = () => {
  const dir = getLogDir();
  fs.ensureDirSync(dir);
};

ensureLogDirExists();

const createFileTransport = (filename, level) => {
  return new winston.transports.File({
    filename: path.join(getLogDir(), filename),
    level: level,
    format: combine(timestamp(), errors({ stack: true }), koreanTimeFormat),
  });
};

let combinedTransport = createFileTransport('combined.log', 'info');
let errorTransport = createFileTransport('error.log', 'error');

const consoleTransport = new winston.transports.Console({
  format: combine(winston.format.colorize(), timestamp(), errors({ stack: true }), koreanTimeFormat),
});

const logger = winston.createLogger({
  level: 'info',
  transports: [combinedTransport, errorTransport, consoleTransport],
  exitOnError: false,
});

const scheduleMidnightRotation = () => {
  const now = moment().tz('Asia/Seoul');
  const nextMidnight = now.clone().add(1, 'day').startOf('day');
  const msUntilMidnight = nextMidnight.diff(now);

  setTimeout(() => {
    ensureLogDirExists();

    logger.remove(combinedTransport);
    logger.remove(errorTransport);

    combinedTransport = createFileTransport('combined.log', 'info');
    errorTransport = createFileTransport('error.log', 'error');

    logger.add(combinedTransport);
    logger.add(errorTransport);

    scheduleMidnightRotation();
  }, msUntilMidnight + 1000);
};

scheduleMidnightRotation();

export default logger;
