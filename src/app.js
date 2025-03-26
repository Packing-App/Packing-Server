// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
// const { errorHandler } = require('./middlewares/errorMiddleware');
const logger = require('./config/logger');

// 라우트 임포트 - 주석 처리 (아직 구현되지 않은 라우트)
const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const friendshipRoutes = require('./routes/friendships');
// const journeyRoutes = require('./routes/journeys');
// const packingItemRoutes = require('./routes/packingItems');
// const notificationRoutes = require('./routes/notifications');

// Passport 설정
require('./config/passport');

const app = express();

// 미들웨어
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(passport.initialize());

// 기본 라우트 추가 (서버 실행 테스트용)
app.get('/', (req, res) => {
  res.json({ message: 'Packing 앱 API 서버가 실행 중입니다!' });
});

// 라우트 - 주석 처리 (아직 구현되지 않은 라우트)
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/friendships', friendshipRoutes);
// app.use('/api/journeys', journeyRoutes);
// app.use('/api/packing-items', packingItemRoutes);
// app.use('/api/notifications', notificationRoutes);

// 에러 핸들링 미들웨어 - 임시 간단한 에러 핸들러 추가
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  logger.error(`Error: ${err.message}`);
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

module.exports = app;