// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const mongoose = require('mongoose');
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

// SESSION_SECRET은 필수. 하드코딩 폴백을 두지 않는다(시크릿 위생).
// 미설정 시 조용히 기본값으로 뜨면 세션 위조 위험이 있으므로 명확히 종료한다.
if (!process.env.SESSION_SECRET) {
  logger.error('SESSION_SECRET 환경변수가 설정되지 않았습니다. 서버를 종료합니다.');
  process.exit(1);
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));


// 기본 라우트 추가 (서버 실행 테스트용)
app.get('/', (req, res) => {
  res.json({ message: 'PackingAPP Server is Running.' });
});

// Liveness — 프로세스가 살아있는지. Cloud Run/Render 헬스체크가 이걸 본다.
// 무조건 200이라 DB 상태와 무관하게 "컨테이너 기동됨"만 알린다.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// Readiness — 실제로 요청을 처리할 준비가 됐는지(= MongoDB 연결됨).
// mongoose.connection.readyState === 1 이면 연결됨. 아니면 503으로 "아직 아님"을 알린다.
// Cloud Run 롤아웃/모니터링에서 DB 끊김을 감지하는 데 쓴다.
app.get('/health/ready', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ready' : 'not-ready',
    db: connected ? 'connected' : 'disconnected'
  });
});

// Apple App Site Association (유니버설 링크). /join/* 경로를 앱으로 연결.
// 확장자 없이 application/json으로 서빙해야 iOS가 인식한다.
app.get('/.well-known/apple-app-site-association', (req, res) => {
  const teamId = process.env.APPLE_TEAM_ID;
  res.type('application/json').json({
    applinks: {
      apps: [],
      details: [
        {
          appID: `${teamId}.me.iyungui.Packing`,
          paths: ['/join/*']
        }
      ]
    }
  });
});

// 초대 링크 웹 랜딩 (미설치 폴백). 앱 설치 시 iOS가 이 페이지 대신 앱을 연다.
app.get('/join/:code', (req, res) => {
  const code = String(req.params.code || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 16);
  const appStoreUrl = 'https://apps.apple.com/app/id6745450311';
  res.type('html').send(`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>패킹 여행 초대</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;margin:0;padding:0;background:#f7f7f8;color:#1c1c1e;display:flex;min-height:100vh;align-items:center;justify-content:center}
  .card{background:#fff;border-radius:20px;padding:32px 24px;max-width:340px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.08)}
  h1{font-size:20px;margin:8px 0 4px}
  p{color:#6b6b70;font-size:14px;line-height:1.5}
  .code{font-size:22px;font-weight:700;letter-spacing:2px;margin:16px 0;color:#2b7fff}
  a.btn{display:block;margin-top:16px;background:#2b7fff;color:#fff;text-decoration:none;padding:14px;border-radius:12px;font-weight:600}
</style>
</head>
<body>
  <div class="card">
    <h1>🧳 패킹 여행 초대</h1>
    <p>친구가 여행에 초대했어요.<br>패킹 앱에서 아래 코드로 참여하세요.</p>
    <div class="code">${code}</div>
    <a class="btn" href="${appStoreUrl}">App Store에서 패킹 받기</a>
  </div>
</body>
</html>`);
});

// 라우트 - 주석 처리 (아직 구현되지 않은 라우트)
// 기존 /api 접두사를 사용하는 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friendships', friendshipRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/packing-items', packingItemRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/notifications', notificationRoutes);

// iOS 앱과의 호환성을 위해 /api 접두사가 없는 라우트도 함께 제공
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/friendships', friendshipRoutes);
app.use('/journeys', journeyRoutes);
app.use('/packing-items', packingItemRoutes);
app.use('/locations', locationRoutes);
app.use('/devices', deviceRoutes);
app.use('/notifications', notificationRoutes);

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