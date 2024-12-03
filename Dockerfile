# Node.js 베이스 이미지 사용
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /usr/gacha_server

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 5555

# CMD ["ls", "-lsrta"]

# 애플리케이션 실행
CMD ["npx", "pm2-runtime", "start", "ecosystem.config.cjs"]
