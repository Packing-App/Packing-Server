// src/routes/auth.js
const express = require('express');
const passport = require('passport');
const socialAuthController = require('../controllers/socialAuthController');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const logger = require('../config/logger');
const router = express.Router();

// Basic auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);

// Social auth routes
router.get('/google', (req, res, next) => {
  // device 파라미터 캡처
  if (req.query.device) {
    req.session = req.session || {};
    req.session.deviceId = req.query.device;
    logger.info(`Device ID captured: ${req.query.device}`);
  }
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: req.query.device // 디바이스 ID를 state 파라미터로 전달
  })(req, res, next);
});

// 콜백 URL 처리 수정
router.get('/google/callback', 
  (req, res, next) => {
    // state 파라미터에서 디바이스 ID 복원
    if (req.query.state) {
      req.session = req.session || {};
      req.session.deviceId = req.query.state;
      logger.info(`Device ID restored from state: ${req.query.state}`);
    }
    next();
  },
  passport.authenticate('google', { session: false }), 
  socialAuthController.socialLoginSuccess
);


// Kakao OAuth
router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback', 
  passport.authenticate('kakao', { session: false }), 
  socialAuthController.socialLoginSuccess
);

// Naver OAuth
router.get('/naver', passport.authenticate('naver'));
router.get('/naver/callback', 
  passport.authenticate('naver', { session: false }), 
  socialAuthController.socialLoginSuccess
);

// 현재 구현 방식에서는 iOS 앱이 Apple과의 인증을 처리하고, 서버는 그 결과만 받아 사용자 생성 및 인증 토큰 발급을 담당
router.post('/apple/verify', socialAuthController.appleVerify);


module.exports = router;

