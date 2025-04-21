// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const logger = require('./config/logger');
// src/app.js에 추가
const session = require('express-session');

// 라우트 임포트 - 주석 처리 (아직 구현되지 않은 라우트)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const friendshipRoutes = require('./routes/friendships');
const journeyRoutes = require('./routes/journeys');
const packingItemRoutes = require('./routes/packingItems');
const locationRoutes = require('./routes/locationRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

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

// 미들웨어 부분에 추가
app.use(session({
  secret: process.env.SESSION_SECRET || 'packingapp-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));


// 기본 라우트 추가 (서버 실행 테스트용)
app.get('/', (req, res) => {
  res.json({ message: 'PackingAPP Server is Running.' });
});

// 라우트 - 주석 처리 (아직 구현되지 않은 라우트)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friendships', friendshipRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/packing-items', packingItemRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/notifications', notificationRoutes);

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