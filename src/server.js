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
  if (err.code === 'EADDRINUSE') {
    // Try alternative port
    const altPort = 5001;
    logger.error(`Port ${PORT} is busy, trying port ${altPort}...`);
    app.listen(altPort, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${altPort}`);
    });
  } else {
    logger.error(`Error starting server: ${err.message}`);
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