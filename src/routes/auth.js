// src/routes/auth.js
const express = require('express');
const passport = require('passport');
const socialAuthController = require('../controllers/socialAuthController');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Basic auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);

// Social auth routes
// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
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

// Apple OAuth
router.get('/apple', passport.authenticate('apple'));
router.post('/apple/callback', 
  passport.authenticate('apple', { session: false }), 
  socialAuthController.socialLoginSuccess
);

router.post('/apple/verify', async (req, res) => {
  try {
    const { userId, email, fullName } = req.body;

    // 필수 데이터 검증
    if (!userId) {
      return res.status(400).json({
        success: false, 
        message: 'Apple User ID is required'
      });
    }

    // 데이터 로깅 (보안에 주의)
    logger.info(`Apple Login Verification: 
      User ID: ${userId}, 
      Email: ${email || 'N/A'}, 
      Name: ${fullName ? `${fullName.givenName} ${fullName.familyName}` : 'N/A'}`
    );

    // 이 시점에서 추가 검증이나 처리 가능
    res.status(200).json({
      success: true,
      message: '사전 검증 완료'
    });
  } catch (error) {
    logger.error(`Apple Login Verification Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '로그인 검증 중 오류 발생'
    });
  }
});

// Failure route for social login
router.get('/social-failure', socialAuthController.socialLoginFailure);

module.exports = router;

