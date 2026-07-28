// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const mongoose = require('mongoose');
const path = require('path');
const logger = require('./config/logger');
// src/app.js에 추가
const session = require('express-session');
const localization = require('./middlewares/localization');
const { landingLimiter } = require('./middlewares/rateLimit');
const { getInvitePreview, toPreviewPayload } = require('./services/invitePreviewService');
const { renderInvite, renderUnavailable } = require('./views/joinLanding');

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

// Accept-Language → req.lang (ko|en). iOS가 기기 로케일로 이 헤더를 실어 보내는데
// 마운트가 빠져 있어 req.lang이 항상 undefined였고, packingItemController의
// ko/en 분기가 전부 ko로 떨어졌다. 현재 req.lang 사용처는 그 컨트롤러뿐이다.
app.use(localization);

// 정적 파일. 초대 링크 공유 미리보기(og:image)용 앱 아이콘과 랜딩 스크립트(join.v1.js)가 있다.
// 라우트와 충돌하지 않도록 `/static` 아래에 둔다.
// 랜딩 스크립트를 외부 파일로 두는 이유: helmet의 script-src 'self'를 그대로 지키기 위해서다
// (이 페이지는 사용자 자유 입력을 렌더하므로 인라인 스크립트를 열어주면 안 된다).
app.use('/static', express.static(path.join(__dirname, '../public'), { maxAge: '7d' }));

// SESSION_SECRET은 필수. 하드코딩 폴백을 두지 않는다(시크릿 위생).
// 미설정 시 조용히 기본값으로 뜨면 세션 위조 위험이 있으므로 명확히 종료한다.
if (!process.env.SESSION_SECRET) {
  logger.error('SESSION_SECRET 환경변수가 설정되지 않았습니다. 서버를 종료합니다.');
  process.exit(1);
}

// APPLE_TEAM_ID가 없으면 AASA가 "undefined.me.iyungui.Packing"을 200으로 서빙한다.
// 200이라 아무 데서도 오류가 안 나고 유니버설 링크만 **조용히** 죽는다. 그래서 기동 시에 끊는다.
if (!process.env.APPLE_TEAM_ID) {
  logger.error('APPLE_TEAM_ID 환경변수가 설정되지 않았습니다(유니버설 링크가 죽습니다). 서버를 종료합니다.');
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

// 초대 링크 웹 랜딩. 앱 설치 시 iOS가 이 페이지 대신 앱을 연다(유니버설 링크).
// 다만 카카오톡 등 인앱 브라우저는 유니버설 링크를 발동시키지 않아 항상 이 페이지가 뜬다.
// 그래서 "앱에서 열기"(커스텀 스킴) 버튼이 사실상 주 경로다.
//
// 마크업은 src/views/joinLanding.js에 있다. 여기서 렌더하는 값에는 사용자 자유 입력이 섞이므로
// 코드를 직접 문자열로 조립하지 말고 그 모듈의 이스케이프를 거칠 것.
// helmet 기본 CSP의 img-src는 `'self' data:`라 여행 대표 이미지(Unsplash)가 차단된다.
// 이 라우트에서만 그 출처 하나를 연다. **script-src는 그대로 둔다** — 사용자 자유 입력을
// 렌더하는 페이지에서 인라인 스크립트를 허용하면 XSS 방어를 하필 필요한 곳에서 끄는 셈이다.
const landingCsp = helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    imgSrc: ["'self'", 'data:', 'https://images.unsplash.com']
  }
});

app.get('/join/:code', landingCsp, landingLimiter, async (req, res, next) => {
  try {
    const preview = await getInvitePreview(req.params.code);

    // 만료·폐기·없는 코드는 404가 아니라 200으로 안내 페이지를 준다.
    // 404를 주면 인앱 브라우저가 자체 오류 화면으로 덮어 안내가 보이지 않는다.
    if (!preview.ok) {
      return res.type('html').send(renderUnavailable());
    }

    // URL 파라미터 원문이 아니라 DB의 코드를 렌더한다(서버가 발급한 값이라 형식이 보장된다).
    return res.type('html').send(
      renderInvite({ code: preview.journey.inviteCode, preview: toPreviewPayload(preview.journey) })
    );
  } catch (error) {
    return next(error);
  }
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