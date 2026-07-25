// src/server.js
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const { seedThemeTemplates } = require('./config/seedData');
const { setupSocketIO } = require('./socket/socketSetup');
const { initSchedulers } = require('./utils/scheduler');

// MongoDB 연결
connectDB().then(() => {
  // 테마 템플릿 초기 데이터 추가
  seedThemeTemplates();
});

const PORT = process.env.PORT || 5000;

// Try to start server, use alternative ports if main port is busy
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}).on('error', (err) => {
  // 프로덕션(Cloud Run 등)에서는 다른 포트로 폴백하면 안 된다.
  // Cloud Run은 주입한 PORT(기본 8080)로만 헬스체크를 하므로, 5001로 옮겨 붙으면
  // 컨테이너가 "떠 있는데도" 헬스체크 실패로 배포가 죽는다. 명확히 죽여서 원인을 드러낸다.
  if (err.code === 'EADDRINUSE' && process.env.NODE_ENV !== 'production') {
    // 로컬 개발 편의: 포트가 물려 있으면 대체 포트로 재시도.
    const altPort = 5001;
    logger.error(`Port ${PORT} is busy, trying port ${altPort}...`);
    app.listen(altPort, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${altPort}`);
    });
  } else {
    logger.error(`Error starting server: ${err.message}`);
    process.exit(1);
  }
});

// Socket.IO 설정
const io = setupSocketIO(server);

// 전역 변수로 io 객체 저장 (다른 모듈에서 접근 가능하도록)
global.io = io;

// 알림 스케줄러 초기화
initSchedulers();

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    logger.info('Process terminated.');
  });
});