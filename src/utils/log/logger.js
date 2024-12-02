// logger.js
import winston from 'winston';
import moment from 'moment-timezone';
import fs from 'fs-extra';
import path from 'path';

// 사용자 정의 에러 클래스
class CustomError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// 로그 포맷 설정
const { combine, timestamp, printf, errors } = winston.format;

const koreanTimeFormat = printf(({ level, message, timestamp, stack }) => {
  const koreanTime = moment(timestamp).tz('Asia/Seoul');
  const formattedTime = koreanTime.format('YYYY-MM-DD HH:mm:ss UTC+0900');
  return stack
    ? `${formattedTime} ${level}: ${message}\n${stack}`
    : `${formattedTime} ${level}: ${message}`;
});

// 로그 디렉토리 설정
const logDirectory = path.resolve('logs');

// 현재 날짜를 기반으로 한 디렉토리 경로 반환
const getLogDir = () => {
  const date = moment().tz('Asia/Seoul').format('YYYY-MM-DD');
  return path.join(logDirectory, date);
};

// 디렉토리 생성 함수
const ensureLogDirExists = () => {
  const dir = getLogDir();
  fs.ensureDirSync(dir);
};

// 초기 로그 디렉토리 생성
ensureLogDirExists();

// 파일 트랜스포트 생성 함수
const createFileTransport = (filename, level) => {
  return new winston.transports.File({
    filename: path.join(getLogDir(), filename),
    level: level,
    format: combine(
      timestamp(),
      errors({ stack: true }), // 스택 트레이스 포함
      koreanTimeFormat
    ),
  });
};

// 초기 트랜스포트 생성
let combinedTransport = createFileTransport('combined.log', 'info');
let errorTransport = createFileTransport('error.log', 'error');

// 콘솔 출력 트랜스포트 설정
const consoleTransport = new winston.transports.Console({
  format: combine(
    winston.format.colorize(),
    timestamp(),
    errors({ stack: true }),
    koreanTimeFormat
  ),
});

// 로거 생성
const logger = winston.createLogger({
  level: 'info', // 기본 로그 레벨
  transports: [
    combinedTransport,
    errorTransport,
    consoleTransport,
  ],
  exitOnError: false,
});

// 자정에 새로운 로그 디렉토리와 트랜스포트를 설정하는 함수
const scheduleMidnightRotation = () => {
  const now = moment().tz('Asia/Seoul');
  const nextMidnight = now.clone().add(1, 'day').startOf('day');
  const msUntilMidnight = nextMidnight.diff(now);

  setTimeout(() => {
    // 새 로그 디렉토리 생성
    ensureLogDirExists();

    // 기존 트랜스포트 제거
    logger.remove(combinedTransport);
    logger.remove(errorTransport);

    // 새 트랜스포트 생성
    combinedTransport = createFileTransport('combined.log', 'info');
    errorTransport = createFileTransport('error.log', 'error');

    // 로거에 새 트랜스포트 추가
    logger.add(combinedTransport);
    logger.add(errorTransport);

    // 다시 스케줄 설정
    scheduleMidnightRotation();
  }, msUntilMidnight + 1000); // 정확히 자정에 실행되도록 1초 여유
};


// 자정 회전 스케줄 시작
scheduleMidnightRotation();

export default logger;
